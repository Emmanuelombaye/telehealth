# =============================================================================
# NOT FOR SUPABASE SQL EDITOR — this is a PowerShell terminal script.
# Database fix SQL: scripts/sql/RUN_IN_SUPABASE_FIX_ALL_DATABASE.sql
# =============================================================================
# Deploy browser-invoked Supabase Edge Functions (fixes CORS preflight when verify_jwt=false in config.toml).
# Requires: npx supabase login + project link, or SUPABASE_ACCESS_TOKEN + project ref.
#
# Usage:
#   $env:SUPABASE_PROJECT_REF = "kvopgyhcjcniaocjozje"
#   .\scripts\deploy-browser-edge-functions.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = if ($env:SUPABASE_PROJECT_REF) { $env:SUPABASE_PROJECT_REF } else { "kvopgyhcjcniaocjozje" }

$functions = @(
  "invite-doctor",
  "assign-doctor",
  "dispatch-prescription",
  "create-payment-intent",
  "stripe-attach-order",
  "merge-scheduling-pending",
  "send-otp",
  "verify-otp",
  "verify-identity",
  "zoom-video-token",
  "ai-medical-scribe",
  "stripe-create-refund",
  "process-refund",
  "partner-api"
)

Write-Host "Deploying Edge Functions to project $ProjectRef ..."

foreach ($fn in $functions) {
  Write-Host "-> $fn"
  npx supabase functions deploy $fn --project-ref $ProjectRef
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Deploy failed for $fn"
  }
}

Write-Host "Done. Apply DB migration: npx supabase db push --project-ref $ProjectRef"
