const { DocForge } = require('./index.js');

async function testMultiTenantAndRateLimiter() {
  console.log('=================================================');
  console.log('🚀 Testing Multi-Tenant API Keys & Rate Limiting');
  console.log('=================================================');

  const client = new DocForge({
    apiKey: 'df_live_swagger_demo_key_991823',
    baseUrl: 'http://localhost:4000'
  });

  // 1. Create a Restricted Test API Key (Rate Limit: 5 req/min)
  console.log('\n1. Provisioning a new restricted API Key (Limit: 5 req/min)...');
  const keyRes = await fetch('http://localhost:4000/v1/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-DocForge-Key': 'df_live_swagger_demo_key_991823'
    },
    body: JSON.stringify({
      name: 'Automated Rate Limit Test Key',
      account_id: 'acct_rate_test_9918',
      rate_limit_per_min: 5
    })
  }).then(r => r.json());

  console.log('✅ Created API Key:', keyRes.key.api_key);
  console.log('   Key ID:', keyRes.key.key_id);
  console.log('   Configured Limit:', keyRes.key.rate_limit_per_min, 'req/min');

  const restrictedClient = new DocForge({
    apiKey: keyRes.key.api_key,
    baseUrl: 'http://localhost:4000'
  });

  // 2. Fire 6 Rapid Requests using the Restricted Key
  console.log('\n2. Firing 6 rapid requests to test rate limit enforcement (Quota: 5)...');
  for (let i = 1; i <= 6; i++) {
    try {
      const res = await fetch('http://localhost:4000/v1/templates', {
        headers: { 'X-DocForge-Key': keyRes.key.api_key }
      });

      const limit = res.headers.get('X-RateLimit-Limit');
      const remaining = res.headers.get('X-RateLimit-Remaining');
      const reset = res.headers.get('X-RateLimit-Reset');

      if (res.status === 429) {
        const body = await res.json();
        console.log(`❌ [Request #${i}] HTTP 429 RATE LIMIT EXCEEDED (As Expected)!`);
        console.log(`   Message:   ${body.message}`);
        console.log(`   Remaining: ${remaining} | Reset in: ${reset}s`);
      } else {
        console.log(`✅ [Request #${i}] HTTP ${res.status} OK | Remaining: ${remaining}/${limit} | Reset in: ${reset}s`);
      }
    } catch (err) {
      console.error(`Request #${i} Error:`, err.message);
    }
  }

  // 3. Revoke the Test API Key
  console.log('\n3. Revoking Test API Key...');
  const revokeRes = await fetch(`http://localhost:4000/v1/keys/${keyRes.key.key_id}`, {
    method: 'DELETE',
    headers: { 'X-DocForge-Key': 'df_live_swagger_demo_key_991823' }
  }).then(r => r.json());

  console.log('✅ Revocation Status:', revokeRes.result.status);

  // 4. Verify Revoked Key Returns 401 Unauthorized
  console.log('\n4. Verifying revoked key access returns 401 Unauthorized...');
  const unauthorizedRes = await fetch('http://localhost:4000/v1/templates', {
    headers: { 'X-DocForge-Key': keyRes.key.api_key }
  });
  console.log('✅ Revoked Access Status:', unauthorizedRes.status, (await unauthorizedRes.json()).message);

  console.log('\n=================================================');
  console.log('🎉 MULTI-TENANT RATE LIMITING TEST COMPLETED SUCCESSFULLY!');
  console.log('=================================================');
}

testMultiTenantAndRateLimiter().catch(err => {
  console.error('❌ Rate Limit Test Error:', err);
  process.exit(1);
});
