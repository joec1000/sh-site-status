export const GCS_PATHS = {
  INCIDENTS_DIR: "incidents",
  CURRENT_STATUS: "status/current_status.json",
  COMPONENTS: "components/components.json",
  incidentFile: (id: string) => `incidents/${id}.json`,
} as const;

export const DEFAULT_COMPONENTS: { id: string; name: string; description: string; group: string; order: number }[] = [
  // Top-level services
  { id: "website", name: "Website", description: "Production applications and storefront", group: "Services", order: 0 },
  { id: "admin-portal", name: "Admin Portal", description: "Internal tools and admin dashboard", group: "Services", order: 1 },
  { id: "mobile-app", name: "Mobile App", description: "iOS and Android mobile applications", group: "Services", order: 2 },
  { id: "infrastructure", name: "Cloud Infrastructure", description: "Servers, Kubernetes, and cloud platform", group: "Services", order: 3 },
  { id: "database", name: "Database", description: "Data storage and query services", group: "Services", order: 4 },
  { id: "networking", name: "Networking", description: "Connectivity, CDN, and DNS services", group: "Services", order: 5 },
  // Website sub-services
  { id: "website-plp", name: "Product Listing (PLP)", description: "Category and listing pages", group: "website", order: 10 },
  { id: "website-pdp", name: "Product Detail (PDP)", description: "Individual product pages", group: "website", order: 11 },
  { id: "website-homepage", name: "Homepage", description: "Main landing page", group: "website", order: 12 },
  { id: "website-cart", name: "Cart", description: "Shopping cart", group: "website", order: 13 },
  { id: "website-checkout", name: "Checkout", description: "Checkout and payment", group: "website", order: 14 },
  { id: "website-order-status", name: "Order Status", description: "Order tracking and history", group: "website", order: 15 },
  { id: "website-search", name: "Search", description: "Product search and filtering", group: "website", order: 16 },
  // Admin Portal sub-services
  { id: "admin-dashboard", name: "Dashboard", description: "Admin overview dashboard", group: "admin-portal", order: 20 },
  { id: "admin-orders", name: "Order Management", description: "Order processing tools", group: "admin-portal", order: 21 },
  { id: "admin-users", name: "User Management", description: "User and permissions management", group: "admin-portal", order: 22 },
  { id: "admin-reports", name: "Reports", description: "Analytics and reporting", group: "admin-portal", order: 23 },
  // Mobile App sub-services
  { id: "mobile-ios", name: "iOS App", description: "iPhone and iPad app", group: "mobile-app", order: 30 },
  { id: "mobile-android", name: "Android App", description: "Android app", group: "mobile-app", order: 31 },
  // Infrastructure sub-services
  { id: "infra-kubernetes", name: "Kubernetes", description: "Container orchestration and nodes", group: "infrastructure", order: 40 },
  { id: "infra-cloud-run", name: "Cloud Run", description: "Serverless compute platform", group: "infrastructure", order: 41 },
  { id: "infra-storage", name: "Cloud Storage", description: "Object storage (GCS)", group: "infrastructure", order: 42 },
  { id: "infra-cicd", name: "CI/CD Pipelines", description: "Build and deployment pipelines", group: "infrastructure", order: 43 },
  { id: "infra-monitoring", name: "Monitoring & Alerting", description: "Monitoring systems and alerts", group: "infrastructure", order: 44 },
  // Database sub-services
  { id: "db-primary", name: "Primary Database", description: "Main production database", group: "database", order: 50 },
  { id: "db-replica", name: "Read Replicas", description: "Database read replicas", group: "database", order: 51 },
  { id: "db-cache", name: "Cache Layer", description: "Redis/Memcached caching", group: "database", order: 52 },
  // Networking sub-services
  { id: "net-cdn", name: "CDN", description: "Content delivery network", group: "networking", order: 60 },
  { id: "net-dns", name: "DNS", description: "Domain name resolution", group: "networking", order: 61 },
  { id: "net-auth", name: "Identity & Auth", description: "Authentication and SSO services", group: "networking", order: 62 },
];

export const STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  degraded: "Degraded Performance",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  maintenance: "Under Maintenance",
};

export const SEVERITY_LABELS: Record<string, string> = {
  sev1: "Critical",
  sev2: "High",
  sev3: "Medium",
  sev4: "Low",
  sev5: "Lowest",
};

export const SEVERITY_DESCRIPTIONS: Record<string, string> = {
  sev1: "Total system outage affecting core business operations",
  sev2: "Major functionality impaired impacting multiple users",
  sev3: "Performance issues affecting specific user groups",
  sev4: "Non-critical issue affecting individual users",
  sev5: "Minor glitches/cosmetic issues with minimal impact",
};

export const SEVERITY_RESPONSE: Record<string, string> = {
  sev1: "Every 15 minutes",
  sev2: "Every 30 minutes",
  sev3: "Every 30 minutes",
  sev4: "As needed / ticket workflow",
  sev5: "As needed / backlog",
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export const COMMUNICATION_MATRIX: Record<string, { channels: string; audience: string; frequency: string }> = {
  sev1: { channels: "Slack #incident-alert-hub + Email", audience: "Senior Exec Team, Leadership Team", frequency: "Every 15 minutes" },
  sev2: { channels: "Slack #incident-alert-hub + Email", audience: "Senior Exec Team, Leadership Team", frequency: "Every 30 minutes" },
  sev3: { channels: "Slack #incident-alert-hub", audience: "Senior Exec Team, Leadership Team", frequency: "Every 30 minutes" },
  sev4: { channels: "Ticket workflow", audience: "Business Teams (CX/PSI)", frequency: "As needed" },
  sev5: { channels: "Backlog", audience: "Business Teams (CX/PSI)", frequency: "As needed" },
};

export const QUICK_LINKS: { icon: "slack" | "web"; name: string; url: string }[] = [
  { icon: "slack", name: "#incident-alert-hub", url: "https://supplyhouseworkspace.slack.com/archives/C078SMWB90C" },
  { icon: "slack", name: "#help-desk", url: "https://supplyhouseworkspace.slack.com/archives/C09HT2MGB2L" },
  { icon: "web", name: "SupplyHouse.com", url: "https://www.supplyhouse.com" },
];

export const ADMIN_QUICK_LINKS: { icon: "slack" | "web"; name: string; url: string }[] = [
  { icon: "slack", name: "#critical-outage-devteam", url: "https://supplyhouseworkspace.slack.com/archives/C05QPPB63LL" },
  { icon: "slack", name: "#help-desk-heroes", url: "https://supplyhouseworkspace.slack.com/archives/C013U0RKBHA" },
  { icon: "web", name: "Incident Response Process", url: "https://supplyhouse.atlassian.net/wiki/spaces/SUPPLYHOUS/pages/3057778697/Critical+Production+Incident+Response+Process" },
  { icon: "web", name: "Kibana", url: "http://34.74.189.135:5601/s/mobile-apps/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-3h,to:now))&_a=(columns:!(),filters:!(),index:d8b1c880-dffa-11eb-81e5-51b88ab061d6,interval:auto,query:(language:kuery,query:'ERROR%20AND%20*order*'),sort:!(!('@timestamp',desc)))" },
  { icon: "web", name: "Dynatrace", url: "https://bxl35886.live.dynatrace.com/#problems/problemdetails;pid=3762788777378858850_1773886560000V2" },
];

export const COMPONENT_GROUPS = ["Services"] as const;

export const TOP_LEVEL_SERVICE_IDS = ["website", "admin-portal", "mobile-app", "infrastructure", "database", "networking"] as const;
