const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BillingService {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(__dirname, 'billing_store.json');
    this.keys = new Map();
    this.usageLogs = [];
    this.loadStore();
  }

  loadStore() {
    try {
      const defaultKey = 'MAP-LEADS-DEMO-2026';
      const unlimitedKey = 'MAP-UNLIMITED-TESTING-2026';

      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const data = JSON.parse(raw);
        if (data.keys) {
          Object.entries(data.keys).forEach(([key, info]) => {
            this.keys.set(key, info);
          });
        }
        if (Array.isArray(data.usageLogs)) {
          this.usageLogs = data.usageLogs;
        }
        if (!this.keys.has(defaultKey)) {
          this.keys.set(defaultKey, {
            key: defaultKey,
            owner: 'Demo User',
            tier: 'Pro Trial',
            credits: 100,
            totalUsed: 12,
            createdAt: new Date().toISOString()
          });
        }

        if (!this.keys.has(unlimitedKey)) {
          this.keys.set(unlimitedKey, {
            key: unlimitedKey,
            owner: 'Tester / Admin',
            tier: 'Unlimited VIP Pass',
            credits: 9999999,
            isUnlimited: true,
            totalUsed: 0,
            createdAt: new Date().toISOString()
          });
        }

        this.saveStore();
      } else {
        const defaultKey = 'MAP-LEADS-DEMO-2026';
        const unlimitedKey = 'MAP-UNLIMITED-TESTING-2026';

        this.keys.set(defaultKey, {
          key: defaultKey,
          owner: 'Demo User',
          tier: 'Pro Trial',
          credits: 100,
          totalUsed: 12,
          createdAt: new Date().toISOString()
        });

        this.keys.set(unlimitedKey, {
          key: unlimitedKey,
          owner: 'Tester / Admin',
          tier: 'Unlimited VIP Pass',
          credits: 9999999,
          isUnlimited: true,
          totalUsed: 0,
          createdAt: new Date().toISOString()
        });

        this.saveStore();
      }
    } catch (err) {
      console.error('[BillingService] Failed to load store:', err.message);
    }
  }

  saveStore() {
    try {
      const exportData = {
        keys: Object.fromEntries(this.keys),
        usageLogs: this.usageLogs.slice(-100) // Keep last 100 entries
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(exportData, null, 2), 'utf8');
    } catch (err) {
      console.error('[BillingService] Failed to save store:', err.message);
    }
  }

  generateKey(owner = 'New User', tier = 'Starter Pack', initialCredits = 250) {
    const key = `MAP-${tier.toUpperCase().replace(/\s+/g, '')}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const info = {
      key,
      owner,
      tier,
      credits: initialCredits,
      totalUsed: 0,
      createdAt: new Date().toISOString()
    };
    this.keys.set(key, info);
    this.saveStore();
    return info;
  }

  getKey(key) {
    return this.keys.get(key) || null;
  }

  verifyAndDeductCredits(key, count = 1) {
    // If no key provided, check for anonymous free tier limit
    if (!key) {
      return { allowed: true, isAnonymous: true, remainingCredits: 5, tier: 'Anonymous Free' };
    }

    const keyInfo = this.keys.get(key);
    if (!keyInfo) {
      return { allowed: false, reason: 'Invalid API Key' };
    }

    if (keyInfo.isUnlimited) {
      keyInfo.totalUsed += count;
      this.keys.set(key, keyInfo);
      this.saveStore();
      return {
        allowed: true,
        remainingCredits: '∞ Unlimited',
        totalUsed: keyInfo.totalUsed,
        tier: keyInfo.tier,
        owner: keyInfo.owner
      };
    }

    if (keyInfo.credits < count) {
      return { allowed: false, reason: `Insufficient credits. Required: ${count}, Available: ${keyInfo.credits}`, remainingCredits: keyInfo.credits };
    }

    keyInfo.credits -= count;
    keyInfo.totalUsed += count;
    this.keys.set(key, keyInfo);

    this.usageLogs.push({
      key,
      used: count,
      remaining: keyInfo.credits,
      timestamp: new Date().toISOString()
    });

    this.saveStore();
    return {
      allowed: true,
      remainingCredits: keyInfo.credits,
      totalUsed: keyInfo.totalUsed,
      tier: keyInfo.tier,
      owner: keyInfo.owner
    };
  }

  getStats() {
    let totalKeys = this.keys.size;
    let totalCreditsIssued = 0;
    let totalLeadsExtracted = 0;

    for (const info of this.keys.values()) {
      totalCreditsIssued += (info.credits + info.totalUsed);
      totalLeadsExtracted += info.totalUsed;
    }

    return {
      totalKeys,
      totalCreditsIssued,
      totalLeadsExtracted,
      recentUsage: this.usageLogs.slice(-10)
    };
  }
}

module.exports = BillingService;
