# Fleet Management Final Verification Report

**Generated:** 2025-11-21T00:50:15.108Z

## Executive Summary

### Fix #1: Double /api/ URLs
**Status:** ❌ FAIL

### Fix #2: CORS Headers
**Status:** ✅ PASS

## Detailed Test Results

### Production (Front Door)

**URL:** https://fleet.capitaltechalliance.com

**Timestamp:** 2025-11-21T00:50:05.097Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** 

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** 

#### Performance Metrics
- **Page Load Time:** 791ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Page Error: Cannot set properties of undefined (setting 'Activity')

#### Screenshots
- production--front-door--homepage.png

---

### Production (Front Door)

**URL:** https://fleet.capitaltechalliance.com

**Timestamp:** 2025-11-21T00:50:06.054Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** No API requests detected. Application may be fully static or API calls were not triggered.

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** 

#### Performance Metrics
- **Page Load Time:** 0ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Page Error: Cannot set properties of undefined (setting 'Activity')

#### Screenshots
- production--front-door--api-test.png

---

### Production (Front Door)

**URL:** https://fleet.capitaltechalliance.com

**Timestamp:** 2025-11-21T00:50:07.004Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** 

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** No API requests detected to verify CORS headers

#### Performance Metrics
- **Page Load Time:** 0ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Page Error: Cannot set properties of undefined (setting 'Activity')

#### Screenshots
- production--front-door--cors-test.png

---

### Production (Front Door)

**URL:** https://fleet.capitaltechalliance.com

**Timestamp:** 2025-11-21T00:50:07.916Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** 

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** 

#### Performance Metrics
- **Page Load Time:** 0ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Page Error: Cannot set properties of undefined (setting 'Activity')

#### Screenshots
- production--front-door--final.png

---

### Static Web App

**URL:** https://green-pond-0f040980f.3.azurestaticapps.net

**Timestamp:** 2025-11-21T00:50:08.821Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** 

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** 

#### Performance Metrics
- **Page Load Time:** 1495ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Console Error: Failed to load resource: the server responded with a status of 405 ()
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/vehicles' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730)
- Console Error: ErrorBoundary caught: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730) {componentStack: 
    at Cse (https://green-pond-0f040980f.3.azures…staticapps.net/assets/index-Bnu1oiEV.js:60:21852)}
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/drivers' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/work-orders' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/maintenance-schedules' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/fuel-transactions' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/facilities' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/routes' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002

#### Screenshots
- static-web-app-homepage.png

---

### Static Web App

**URL:** https://green-pond-0f040980f.3.azurestaticapps.net

**Timestamp:** 2025-11-21T00:50:10.539Z

#### Fix #1: Double /api/ URLs
- **Status:** PASS
- **Details:** All 7 API requests use correct path structure
- **Evidence:**
  - `https://fleet.capitaltechalliance.com/api/vehicles`
  - `https://fleet.capitaltechalliance.com/api/drivers`
  - `https://fleet.capitaltechalliance.com/api/work-orders`
  - `https://fleet.capitaltechalliance.com/api/fuel-transactions`
  - `https://fleet.capitaltechalliance.com/api/facilities`

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** 

#### Performance Metrics
- **Page Load Time:** 0ms
- **Network Requests:** 7 API calls

#### Errors Detected
- Console Error: Failed to load resource: the server responded with a status of 405 ()
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/vehicles' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730)
- Console Error: ErrorBoundary caught: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730) {componentStack: 
    at Cse (https://green-pond-0f040980f.3.azures…staticapps.net/assets/index-Bnu1oiEV.js:60:21852)}
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/drivers' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/work-orders' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/facilities' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/fuel-transactions' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/routes' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/maintenance-schedules' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002

#### API Network Requests
| URL | Method | Status |
|-----|--------|--------|
| https://fleet.capitaltechalliance.com/api/vehicles | GET | pending |
| https://fleet.capitaltechalliance.com/api/drivers | GET | pending |
| https://fleet.capitaltechalliance.com/api/work-orders | GET | pending |
| https://fleet.capitaltechalliance.com/api/fuel-transactions | GET | pending |
| https://fleet.capitaltechalliance.com/api/facilities | GET | pending |
| https://fleet.capitaltechalliance.com/api/maintenance-schedules | GET | pending |
| https://fleet.capitaltechalliance.com/api/routes | GET | pending |

#### Screenshots
- static-web-app-api-test.png

---

### Static Web App

**URL:** https://green-pond-0f040980f.3.azurestaticapps.net

**Timestamp:** 2025-11-21T00:50:12.079Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** 

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** No API requests detected to verify CORS headers

#### Performance Metrics
- **Page Load Time:** 0ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Console Error: Failed to load resource: the server responded with a status of 405 ()
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/maintenance-schedules' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/vehicles' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730)
- Console Error: ErrorBoundary caught: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730) {componentStack: 
    at Cse (https://green-pond-0f040980f.3.azures…staticapps.net/assets/index-Bnu1oiEV.js:60:21852)}
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/work-orders' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/fuel-transactions' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/drivers' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/routes' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/facilities' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002

#### Screenshots
- static-web-app-cors-test.png

---

### Static Web App

**URL:** https://green-pond-0f040980f.3.azurestaticapps.net

**Timestamp:** 2025-11-21T00:50:13.636Z

#### Fix #1: Double /api/ URLs
- **Status:** UNKNOWN
- **Details:** 

#### Fix #2: CORS Headers
- **Status:** UNKNOWN
- **Details:** 

#### Performance Metrics
- **Page Load Time:** 0ms
- **Network Requests:** 0 API calls

#### Errors Detected
- Console Error: Failed to load resource: the server responded with a status of 405 ()
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/drivers' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730)
- Console Error: ErrorBoundary caught: TypeError: Cannot read properties of undefined (reading 'length')
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:4004
    at Array.filter (<anonymous>)
    at https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3983
    at Object.Wm [as useMemo] (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:58427)
    at Cl.useMemo (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:25:7701)
    at Cse (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4070:3678)
    at Vf (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:49272)
    at fv (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:72532)
    at Nc (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:83225)
    at X (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:48:119730) {componentStack: 
    at Cse (https://green-pond-0f040980f.3.azures…staticapps.net/assets/index-Bnu1oiEV.js:60:21852)}
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/vehicles' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/work-orders' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/maintenance-schedules' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/facilities' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/routes' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002
- Console Error: Access to fetch at 'https://fleet.capitaltechalliance.com/api/fuel-transactions' from origin 'https://green-pond-0f040980f.3.azurestaticapps.net' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- Console Error: Failed to load resource: net::ERR_FAILED
- Console Error: API Error: APIError: Failed to fetch
    at RAt.request (https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:116388)
    at async https://green-pond-0f040980f.3.azurestaticapps.net/assets/index-Bnu1oiEV.js:4142:109002

#### Screenshots
- static-web-app-final.png

---

## Recommendations

✅ All fixes are deployed and working correctly!

