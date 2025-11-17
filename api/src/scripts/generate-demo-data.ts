/**
 * Microsoft Integration Demo Data Generator
 *
 * Generates realistic demo data for Microsoft Teams and Outlook integration:
 * - Teams channels and messages
 * - Email threads
 * - Calendar events
 * - Adaptive cards
 * - Webhook events
 * - Communication logs
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

interface DemoDataOptions {
  teams?: boolean;
  outlook?: boolean;
  calendar?: boolean;
  communications?: boolean;
  webhooks?: boolean;
  count?: number;
}

// Sample data
const SAMPLE_TEAMS = [
  { id: 'team-1', name: 'Fleet Operations', description: 'Daily fleet management' },
  { id: 'team-2', name: 'Maintenance Team', description: 'Vehicle maintenance coordination' },
  { id: 'team-3', name: 'Dispatch Center', description: 'Driver dispatch and routing' }
];

const SAMPLE_CHANNELS = [
  { team_id: 'team-1', id: 'channel-1', name: 'General', description: 'General discussions' },
  { team_id: 'team-1', id: 'channel-2', name: 'Incidents', description: 'Incident reports' },
  { team_id: 'team-2', id: 'channel-3', name: 'Urgent Repairs', description: 'Urgent maintenance' },
  { team_id: 'team-3', id: 'channel-4', name: 'Route Updates', description: 'Route changes' }
];

const SAMPLE_MESSAGES = [
  'Vehicle TRUCK-001 completed delivery route successfully',
  'Scheduled maintenance for VAN-042 at 2:00 PM today',
  'Driver reported minor collision at Main St & 5th Ave',
  'Fuel costs are trending 15% higher this month',
  'New route optimization reduced mileage by 12%',
  '@Driver-Manager Please review timesheet approval',
  'Safety meeting scheduled for Friday at 10 AM',
  'Vehicle inspection passed for all units in Bay 3'
];

const SAMPLE_SUBJECTS = [
  'Fleet Performance Report - Weekly',
  'Maintenance Schedule Update',
  'Vendor Invoice - Tire Replacement',
  'Driver Training Session Confirmation',
  'Insurance Certificate Renewal',
  'Fuel Receipt - Station #42',
  'Work Order #12345 Completed',
  'Route Optimization Results'
];

const SAMPLE_EMAIL_BODIES = [
  '<p>Please find attached the weekly fleet performance report.</p><p>Key highlights:<br/>- Total miles: 12,500<br/>- Fuel efficiency: +3%<br/>- On-time deliveries: 98%</p>',
  '<p>The maintenance schedule has been updated for next week.</p><p>Please review and confirm availability.</p>',
  '<p>Attached is the invoice for tire replacement services.</p><p>Total: $2,450.00<br/>Due: 2025-12-15</p>',
  '<p>This confirms your registration for the driver safety training session.</p><p>Date: 2025-12-10<br/>Time: 9:00 AM<br/>Location: Training Room B</p>'
];

export async function generateDemoData(options: DemoDataOptions = {}): Promise<void> {
  const {
    teams = true,
    outlook = true,
    calendar = true,
    communications = true,
    webhooks = false,
    count = 50
  } = options;

  console.log('🎬 Generating Microsoft Integration Demo Data...\n');

  try {
    // Generate Teams data
    if (teams) {
      console.log('📱 Generating Teams messages...');
      await generateTeamsMessages(count);
      console.log('✓ Teams messages created\n');
    }

    // Generate Outlook data
    if (outlook) {
      console.log('📧 Generating Outlook emails...');
      await generateOutlookEmails(count);
      console.log('✓ Outlook emails created\n');
    }

    // Generate Calendar data
    if (calendar) {
      console.log('📅 Generating Calendar events...');
      await generateCalendarEvents(Math.floor(count / 5));
      console.log('✓ Calendar events created\n');
    }

    // Generate Communication logs
    if (communications) {
      console.log('💬 Generating Communication logs...');
      await generateCommunicationLogs(count);
      console.log('✓ Communication logs created\n');
    }

    // Generate Webhook events
    if (webhooks) {
      console.log('🔔 Generating Webhook events...');
      await generateWebhookEvents(Math.floor(count / 10));
      console.log('✓ Webhook events created\n');
    }

    console.log('✅ Demo data generation complete!\n');
    console.log('Summary:');
    console.log(`  • ${count} Teams messages`);
    console.log(`  • ${count} Outlook emails`);
    console.log(`  • ${Math.floor(count / 5)} Calendar events`);
    console.log(`  • ${count} Communication logs`);
    if (webhooks) console.log(`  • ${Math.floor(count / 10)} Webhook events`);

  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function generateTeamsMessages(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const channel = SAMPLE_CHANNELS[i % SAMPLE_CHANNELS.length];
    const message = SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length];
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // In real implementation, you'd insert into your Teams messages table
    // For now, we'll insert into communications table
    await pool.query(`
      INSERT INTO communications (
        communication_type,
        direction,
        subject,
        body,
        from_contact_name,
        from_contact_email,
        to_contact_emails,
        message_id,
        channel,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      'Teams',
      'Outbound',
      `Message in ${channel.name}`,
      message,
      'Fleet System',
      'system@fleet.com',
      JSON.stringify(['team@fleet.com']),
      `teams-msg-${i}`,
      channel.name,
      createdAt
    ]);
  }
}

async function generateOutlookEmails(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const subject = SAMPLE_SUBJECTS[i % SAMPLE_SUBJECTS.length];
    const body = SAMPLE_EMAIL_BODIES[i % SAMPLE_EMAIL_BODIES.length];
    const direction = i % 3 === 0 ? 'Inbound' : 'Outbound';
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO communications (
        communication_type,
        direction,
        subject,
        body,
        from_contact_name,
        from_contact_email,
        to_contact_emails,
        cc_emails,
        importance,
        message_id,
        created_at,
        read_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      'Email',
      direction,
      subject,
      body,
      direction === 'Inbound' ? 'Vendor Support' : 'Fleet Manager',
      direction === 'Inbound' ? 'vendor@example.com' : 'manager@fleet.com',
      JSON.stringify(direction === 'Inbound' ? ['manager@fleet.com'] : ['recipient@example.com']),
      JSON.stringify([]),
      i % 5 === 0 ? 'High' : 'Normal',
      `outlook-msg-${i}`,
      createdAt,
      i % 4 !== 0 ? createdAt : null // 75% read
    ]);
  }
}

async function generateCalendarEvents(count: number): Promise<void> {
  const EVENT_TYPES = ['Maintenance', 'Training', 'Meeting', 'Inspection', 'Review'];

  for (let i = 0; i < count; i++) {
    const startDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Next 30 days
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    const eventType = EVENT_TYPES[i % EVENT_TYPES.length];

    await pool.query(`
      INSERT INTO calendar_events (
        event_id,
        subject,
        start_time,
        end_time,
        location,
        attendees,
        organizer,
        event_type,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      `event-${i}`,
      `${eventType} - Vehicle Fleet Review`,
      startDate,
      endDate,
      i % 2 === 0 ? 'Conference Room A' : 'Maintenance Bay 3',
      JSON.stringify([
        { email: 'manager@fleet.com', name: 'Fleet Manager' },
        { email: 'supervisor@fleet.com', name: 'Supervisor' }
      ]),
      'scheduler@fleet.com',
      eventType,
      'scheduled',
      new Date()
    ]);
  }
}

async function generateCommunicationLogs(count: number): Promise<void> {
  const CATEGORIES = ['Vehicle Issue', 'Maintenance', 'General Question', 'Urgent', 'Follow-up Required'];
  const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];

  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const sentiment = SENTIMENTS[i % SENTIMENTS.length];
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    await pool.query(`
      INSERT INTO communications (
        communication_type,
        direction,
        subject,
        body,
        from_contact_name,
        from_contact_email,
        category,
        sentiment,
        priority,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      i % 3 === 0 ? 'Phone' : (i % 3 === 1 ? 'SMS' : 'In-Person'),
      i % 2 === 0 ? 'Inbound' : 'Outbound',
      `Communication Log ${i}`,
      `This is a logged communication about ${category.toLowerCase()}`,
      `Contact ${i}`,
      `contact${i}@example.com`,
      category,
      sentiment,
      category === 'Urgent' ? 'High' : 'Normal',
      createdAt
    ]);
  }
}

async function generateWebhookEvents(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const changeType = i % 2 === 0 ? 'created' : 'updated';
    const resource = i % 2 === 0 ? 'teams/messages' : 'outlook/messages';

    await pool.query(`
      INSERT INTO webhook_events (
        subscription_id,
        change_type,
        resource,
        resource_data,
        processed,
        received_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      `sub-${i % 5}`,
      changeType,
      resource,
      JSON.stringify({
        id: `msg-${i}`,
        changeType: changeType,
        timestamp: new Date().toISOString()
      }),
      true,
      new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    ]);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: DemoDataOptions = {
    teams: !args.includes('--no-teams'),
    outlook: !args.includes('--no-outlook'),
    calendar: !args.includes('--no-calendar'),
    communications: !args.includes('--no-communications'),
    webhooks: args.includes('--webhooks'),
    count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '50')
  };

  generateDemoData(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
