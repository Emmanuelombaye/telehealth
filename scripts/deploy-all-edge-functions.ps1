# =============================================================================
# PEAK HEALTH — Deploy ALL Edge Functions to new project
# =============================================================================
# Run this script ONCE after getting your Supabase Access Token from:
#   https://supabase.com/dashboard/account/tokens
#
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_xxxxxxxxxxxxxxxxxxxx"
#   .\scripts\deploy-all-edge-functions.ps1
# =============================================================================

param(
  [string]$Token = $env:SUPABASE_ACCESS_TOKEN
)

if (-not $Token) {
  Write-Host ""
  Write-Host "ERROR: No access token found." -ForegroundColor Red
  Write-Host ""
  Write-Host "Get your token from: https://supabase.com/dashboard/account/tokens" -ForegroundColor Yellow
  Write-Host ""
  Write-Host 'Then run:' -ForegroundColor Cyan
  Write-Host '  $env:SUPABASE_ACCESS_TOKEN = "sbp_your_token_here"' -ForegroundColor White
  Write-Host '  .\scripts\deploy-all-edge-functions.ps1' -ForegroundColor White
  exit 1
}

$env:SUPABASE_ACCESS_TOKEN = $Token
$PROJECT_REF = "xtczoyjcgljxmqxmkkdh"

$functions = @(
  "ai-medical-scribe",
  "assign-doctor",
  "calendly-webhook",
  "create-payment-intent",
  "dispatch-prescription",
  "email-trigger",
  "invite-doctor",
  "merge-scheduling-pending",
  "partner-api",
  "pharmacy-webhook",
  "pmci-webhook",
  "process-refund",
  "scheduling-webhook",
  "send-otp",
  "stripe-attach-order",
  "stripe-create-refund",
  "stripe-identity-webhook",
  "stripe-webhook",
  "thrivewell-dispatch",
  "truepill-webhook",
  "verify-identity",
  "verify-otp",
  "zoom-video-token"
)

Write-Host ""
Write-Host "Deploying $($functions.Count) edge functions to: $PROJECT_REF" -ForegroundColor Cyan
Write-Host ""

$ok = 0
$failed = @()

foreach ($fn in $functions) {
  Write-Host "  -> $fn ..." -NoNewline
  $result = npx supabase functions deploy $fn --project-ref $PROJECT_REF --no-verify-jwt 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
    $ok++
  } else {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "     $result" -ForegroundColor DarkRed
    $failed += $fn
  }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Deployed : $ok / $($functions.Count)" -ForegroundColor Green
if ($failed.Count -gt 0) {
  Write-Host "  Failed   : $($failed -join ', ')" -ForegroundColor Red
}
Write-Host ""
Write-Host "Next: Set Edge Function secrets in the dashboard:" -ForegroundColor Yellow
Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor White
