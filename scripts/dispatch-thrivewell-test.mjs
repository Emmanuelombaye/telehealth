/**
 * Professional CLI Dispatch Tool for ThriveWell Rx External Prescription API.
 *
 * Usage:
 *   npm run check:thrivewell
 *   npm run check:thrivewell -- --type controlled
 *   npm run check:thrivewell -- --type non-controlled
 *
 * Reads secrets automatically from .env.local / .env.production.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyProjectEnv } from './loadEnv.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = applyProjectEnv();

// Color printing helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function logInfo(msg) {
  console.log(`${BLUE}INFO${RESET}  ${msg}`);
}
function logSuccess(msg) {
  console.log(`${GREEN}PASS${RESET}  ${msg}`);
}
function logWarn(msg) {
  console.warn(`${YELLOW}WARN${RESET}  ${msg}`);
}
function logError(msg, details = '') {
  console.error(`${RED}FAIL${RESET}  ${msg}${details ? '\n' + details : ''}`);
}

// 1x1 Pixel JPEG base64 (minimalist valid JPG)
const DUMMY_JPG_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

// Minimal valid PDF document base64
const DUMMY_PDF_BASE64 = 'JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagogMiAwIG9iagogIDw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+CmVuZG9iagogMyAwIG9iagogIDw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCiA0IDAgb2JqCiAgPDwvTGVuZ3RoIDU+PnN0cmVhbQpCVAovRjEgMTIgVGYKNzAgNzAwIFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTkgMDAwMDAgbiAKMDAwMDAwMDA2OSAwMDAwMCBuIAowMDAwMDAwMTIxIDAwMDAgbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAp0cmFpbGVyCiAgPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzExCiUlRU9GCg==';

async function dispatchPrescription(type, url, payloadPath, username, password) {
  const fullPath = join(root, payloadPath);
  if (!existsSync(fullPath)) {
    logError(`Payload template not found at: ${payloadPath}`);
    return false;
  }

  logInfo(`Processing ${BOLD}${type}${RESET} prescription...`);
  const rawData = readFileSync(fullPath, 'utf8');
  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch (err) {
    logError(`Failed to parse JSON template: ${err.message}`);
    return false;
  }

  // Inject valid Base64 payload details in place of mock template tags
  let injectedDlImage = false;
  let injectedPdf = false;

  if (payload.driver_license_image === '{{base64_jpg_image}}') {
    payload.driver_license_image = DUMMY_JPG_BASE64;
    injectedDlImage = true;
  }
  if (payload.encoded_prescription_pdf === '{{base64_pdf_document}}') {
    payload.encoded_prescription_pdf = DUMMY_PDF_BASE64;
    injectedPdf = true;
  }
  if (payload.appoinment_date) {
    payload.appoinment_date = new Date().toISOString().slice(0, 10);
  }

  logInfo(`Payload loaded: ID="${payload.masterId || 'unknown'}", Patient="${payload.patient_first_name || ''} ${payload.patient_last_name || ''}"`);
  if (injectedDlImage) logInfo(`-> Injected dummy 1x1 JPEG driver_license_image`);
  if (injectedPdf) logInfo(`-> Injected dummy valid PDF encoded_prescription_pdf`);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (username && password) {
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    headers['Authorization'] = authHeader;
    logInfo(`Authorization header set (Basic Auth).`);
  } else {
    logWarn(`No credentials provided. Sending unauthenticated request.`);
  }

  console.log(`${CYAN}Sending POST request to:${RESET} ${url}`);
  const startTime = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    const resText = await res.text();
    console.log(`${CYAN}Response Status:${RESET} ${res.status} ${res.statusText} (${duration}ms)`);

    let resJson;
    try {
      resJson = JSON.parse(resText);
    } catch {
      resJson = null;
    }

    if (res.ok) {
      if (resJson && resJson.status === 'success') {
        logSuccess(`ThriveWell accepted prescription! Flow ref: ${JSON.stringify(resJson.data)}`);
        return true;
      } else {
        logError(`ThriveWell API rejection:`, JSON.stringify(resJson || resText, null, 2));
        return false;
      }
    } else {
      logError(`HTTP Error ${res.status}:`, JSON.stringify(resJson || resText, null, 2));
      return false;
    }
  } catch (fetchErr) {
    logError(`Network/Fetch Exception:`, fetchErr.stack || fetchErr.message);
    return false;
  }
}

async function main() {
  console.log(`\n${BOLD}====================================================${RESET}`);
  console.log(`  ${BOLD}${MAGENTA}THRIVEWELL RX — API DISPATCH VERIFICATION TOOL${RESET}`);
  console.log(`${BOLD}====================================================${RESET}\n`);

  const username = env.THRIVEWELL_USERNAME || '';
  const password = env.THRIVEWELL_PASSWORD || '';
  const baseUrl = (env.THRIVEWELL_BASE_URL || 'https://flow.thrivewellrx.com/api').replace(/\/$/, '');

  logInfo(`Configured Base URL: ${baseUrl}`);
  if (username) {
    logInfo(`Configured Username: "${username}"`);
  } else {
    logWarn(`THRIVEWELL_USERNAME is missing from environment.`);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  let typeArg = 'both';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      typeArg = args[i + 1];
    }
  }

  const jobs = [];
  if (typeArg === 'non-controlled' || typeArg === 'both') {
    jobs.push({
      type: 'Non-Controlled',
      url: `${baseUrl}/prescription/non-controlled`,
      payloadPath: 'scripts/prescription-non-controlled-example.json'
    });
  }
  if (typeArg === 'controlled' || typeArg === 'both') {
    jobs.push({
      type: 'Controlled',
      url: `${baseUrl}/prescription/controlled`,
      payloadPath: 'scripts/prescription-controlled-example.json'
    });
  }

  if (jobs.length === 0) {
    logError(`Invalid type argument. Use "controlled", "non-controlled", or "both".`);
    process.exit(1);
  }

  let allSuccess = true;
  for (const job of jobs) {
    console.log(`\n----------------------------------------------------`);
    const success = await dispatchPrescription(
      job.type,
      job.url,
      job.payloadPath,
      username,
      password
    );
    if (!success) allSuccess = false;
  }

  console.log(`\n${BOLD}====================================================${RESET}`);
  console.log(`  ${BOLD}TEST SUMMARY${RESET}`);
  console.log(`${BOLD}====================================================${RESET}`);
  if (allSuccess) {
    console.log(`${GREEN}${BOLD}✓ All dispatches succeeded!${RESET}`);
  } else {
    console.log(`${RED}${BOLD}✖ Some dispatches failed. Verify credentials and payloads.${RESET}`);
    if (!username || !password) {
      console.log(`\n${YELLOW}Note: Credentials are missing. Set them in .env.local:${RESET}`);
      console.log(`  THRIVEWELL_USERNAME=your_username`);
      console.log(`  THRIVEWELL_PASSWORD=your_password`);
    }
  }
  console.log(`${BOLD}====================================================${RESET}\n`);

  if (!allSuccess) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Unhandled Exception:', err);
  process.exit(1);
});
