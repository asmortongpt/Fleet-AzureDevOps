#!/bin/bash
# SSL/TLS Certificate Renewal Script for CTAFleet
# This script automates certificate renewal using cert-manager and Let's Encrypt

set -euo pipefail

# Configuration
NAMESPACE="ctafleet"
CERT_NAME="fleet-tls"
DOMAINS="fleet.ctafleet.com,www.ctafleet.com,api.ctafleet.com"
EMAIL="devops@ctafleet.com"
LOG_FILE="/var/log/ssl-renewal.log"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

log "Starting SSL certificate renewal check..."

# Check if cert-manager is installed
if ! kubectl get deployment -n cert-manager cert-manager &>/dev/null; then
    log "ERROR: cert-manager is not installed"
    log "Installing cert-manager..."

    # Install cert-manager
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=5m

    log "cert-manager installed successfully"
fi

# Check current certificate status
log "Checking current certificate status..."

CERT_STATUS=$(kubectl get certificate ${CERT_NAME} -n ${NAMESPACE} -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "NotFound")

if [ "${CERT_STATUS}" == "True" ]; then
    log "Certificate is valid"

    # Check expiration date
    EXPIRY_DATE=$(kubectl get certificate ${CERT_NAME} -n ${NAMESPACE} -o jsonpath='{.status.notAfter}')
    EXPIRY_SECONDS=$(date -d "${EXPIRY_DATE}" +%s)
    CURRENT_SECONDS=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_SECONDS - CURRENT_SECONDS) / 86400 ))

    log "Certificate expires in ${DAYS_UNTIL_EXPIRY} days (${EXPIRY_DATE})"

    # Renew if less than 30 days until expiry
    if [ ${DAYS_UNTIL_EXPIRY} -lt 30 ]; then
        log "Certificate renewal needed (less than 30 days until expiry)"

        # Force renewal by deleting the secret
        kubectl delete secret ${CERT_NAME} -n ${NAMESPACE} || true
        sleep 5

        log "Certificate renewal triggered"
    else
        log "Certificate renewal not needed"
        exit 0
    fi
else
    log "Certificate not valid or not found, creating new certificate..."
fi

# Create or update certificate
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ${CERT_NAME}
  namespace: ${NAMESPACE}
spec:
  secretName: ${CERT_NAME}
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
$(echo "${DOMAINS}" | tr ',' '\n' | sed 's/^/  - /')
  privateKey:
    algorithm: RSA
    size: 4096
  duration: 2160h  # 90 days
  renewBefore: 720h  # 30 days
EOF

log "Certificate resource created/updated"

# Wait for certificate to be ready
log "Waiting for certificate to be issued..."

for i in {1..60}; do
    CERT_STATUS=$(kubectl get certificate ${CERT_NAME} -n ${NAMESPACE} -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")

    if [ "${CERT_STATUS}" == "True" ]; then
        log "Certificate issued successfully!"

        # Get certificate details
        kubectl describe certificate ${CERT_NAME} -n ${NAMESPACE}

        # Verify the secret was created
        if kubectl get secret ${CERT_NAME} -n ${NAMESPACE} &>/dev/null; then
            log "Certificate secret created: ${CERT_NAME}"

            # Check certificate validity
            CERT_DATA=$(kubectl get secret ${CERT_NAME} -n ${NAMESPACE} -o jsonpath='{.data.tls\.crt}' | base64 -d)
            CERT_SUBJECT=$(echo "${CERT_DATA}" | openssl x509 -noout -subject)
            CERT_ISSUER=$(echo "${CERT_DATA}" | openssl x509 -noout -issuer)
            CERT_DATES=$(echo "${CERT_DATA}" | openssl x509 -noout -dates)

            log "Certificate details:"
            log "  Subject: ${CERT_SUBJECT}"
            log "  Issuer: ${CERT_ISSUER}"
            log "  ${CERT_DATES}"

            # Restart ingress controller to pick up new certificate
            log "Restarting ingress controller..."
            kubectl rollout restart deployment -n ingress-nginx ingress-nginx-controller || log "WARNING: Failed to restart ingress controller"

            # Send success notification
            send_notification "success" "SSL certificate renewed successfully for ${DOMAINS}"

            exit 0
        else
            log "ERROR: Certificate secret not found"
            exit 1
        fi
    elif [ "${CERT_STATUS}" == "False" ]; then
        CERT_MESSAGE=$(kubectl get certificate ${CERT_NAME} -n ${NAMESPACE} -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}')
        log "ERROR: Certificate issuance failed: ${CERT_MESSAGE}"

        # Check CertificateRequest for more details
        kubectl describe certificaterequest -n ${NAMESPACE} | tail -20

        send_notification "failure" "SSL certificate renewal failed: ${CERT_MESSAGE}"
        exit 1
    fi

    log "Waiting for certificate... (attempt ${i}/60)"
    sleep 10
done

log "ERROR: Certificate issuance timed out"
send_notification "failure" "SSL certificate renewal timed out"
exit 1

# Function to send notifications
send_notification() {
    local status="$1"
    local message="$2"

    if [ -n "${WEBHOOK_URL:-}" ]; then
        curl -X POST "${WEBHOOK_URL}" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"${status}\",\"message\":\"${message}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            || log "WARNING: Failed to send notification"
    fi

    # Send email notification using SendGrid (if configured)
    if [ -n "${SENDGRID_API_KEY:-}" ]; then
        curl -X POST "https://api.sendgrid.com/v3/mail/send" \
            -H "Authorization: Bearer ${SENDGRID_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "{
                \"personalizations\": [{\"to\": [{\"email\": \"${EMAIL}\"}]}],
                \"from\": {\"email\": \"noreply@ctafleet.com\"},
                \"subject\": \"SSL Certificate ${status}\",
                \"content\": [{\"type\": \"text/plain\", \"value\": \"${message}\"}]
            }" \
            || log "WARNING: Failed to send email notification"
    fi
}
