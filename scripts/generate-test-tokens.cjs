#!/usr/bin/env node

const jwt = require('jsonwebtoken');

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'nordflytt-super-secret-jwt-key-minimum-32-characters-long-for-security';

// Test users
const testUsers = [
  {
    id: 'test-admin',
    email: 'admin@nordflytt.se',
    role: 'admin',
    name: 'Test Admin'
  },
  {
    id: 'test-staff',
    email: 'staff@nordflytt.se',
    phone: '+46701234567',
    role: 'staff',
    name: 'Test Staff'
  },
  {
    id: 'test-customer',
    email: 'customer@example.com',
    role: 'customer',
    name: 'Test Customer'
  }
];

console.log('🔐 Generating test tokens for Nordflytt...\n');

testUsers.forEach(user => {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
  
  console.log(`👤 ${user.name} (${user.role})`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`🔑 Token: ${token}`);
  console.log('\n---\n');
});

console.log('📝 Usage examples:\n');
console.log('curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/customers');
console.log('curl -H "x-api-key: test-api-key" http://localhost:3001/api/staff/jobs\n');

console.log('⚠️  These tokens are for development/testing only!');
console.log('🚀 Save these tokens in your test environment.');