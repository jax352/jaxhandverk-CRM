declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    CRM_IMPORT_TOKEN?: string;
    BUCKET?: R2Bucket;
  }
}
