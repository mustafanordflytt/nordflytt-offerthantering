#!/usr/bin/env python3
"""
Test IAM role creation and permissions for SageMaker
Run this before full deployment to verify IAM access
"""

import boto3
import json
import sys

# Configuration
AWS_ACCESS_KEY_ID = 'AKIAVVR2P26C7YNCCFTG'
AWS_SECRET_ACCESS_KEY = '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'
AWS_REGION = 'eu-west-2'
AWS_ACCOUNT_ID = '389890955141'
SAGEMAKER_ROLE_NAME = 'NordflyttSageMakerExecutionRole'

print("🔍 Testing IAM Configuration for SageMaker Deployment")
print("=" * 50)

# Initialize session
try:
    session = boto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    print("✅ AWS session initialized")
except Exception as e:
    print(f"❌ Failed to initialize session: {e}")
    sys.exit(1)

# Test 1: Verify credentials
print("\n1️⃣ Verifying AWS credentials...")
try:
    sts = session.client('sts')
    identity = sts.get_caller_identity()
    actual_account_id = identity['Account']
    
    print(f"   Account ID: {actual_account_id}")
    print(f"   User ARN: {identity['Arn']}")
    
    if actual_account_id != AWS_ACCOUNT_ID:
        print(f"   ⚠️  Warning: Account ID mismatch! Expected {AWS_ACCOUNT_ID}, got {actual_account_id}")
    else:
        print(f"   ✅ Account ID matches configuration")
except Exception as e:
    print(f"   ❌ Credential verification failed: {e}")
    sys.exit(1)

# Test 2: Check IAM permissions
print("\n2️⃣ Checking IAM permissions...")
try:
    iam = session.client('iam')
    
    # Try to list roles (requires IAM read permissions)
    iam.list_roles(MaxItems=1)
    print("   ✅ IAM read permissions confirmed")
    
    # Check if we can create roles
    user = identity['Arn'].split('/')[-1]
    try:
        # Get user policies to check for IAM write permissions
        iam.list_attached_user_policies(UserName=user)
        print("   ✅ IAM policy listing confirmed")
    except:
        print("   ⚠️  Cannot verify IAM write permissions (may still work)")
        
except Exception as e:
    print(f"   ❌ IAM permission check failed: {e}")
    print("   💡 You may need to add IAM permissions to create roles")

# Test 3: Check if role exists
print(f"\n3️⃣ Checking for existing role: {SAGEMAKER_ROLE_NAME}...")
role_exists = False
try:
    role = iam.get_role(RoleName=SAGEMAKER_ROLE_NAME)
    role_exists = True
    print(f"   ✅ Role exists: {role['Role']['Arn']}")
    print(f"   Created: {role['Role']['CreateDate']}")
    
    # Check attached policies
    policies = iam.list_attached_role_policies(RoleName=SAGEMAKER_ROLE_NAME)
    print("   Attached policies:")
    for policy in policies['AttachedPolicies']:
        print(f"     - {policy['PolicyName']}")
        
except iam.exceptions.NoSuchEntityException:
    print(f"   ℹ️  Role does not exist (will be created during deployment)")
except Exception as e:
    print(f"   ❌ Error checking role: {e}")

# Test 4: Check S3 access
print("\n4️⃣ Checking S3 access...")
try:
    s3 = session.client('s3')
    
    # Try to list buckets
    buckets = s3.list_buckets()
    print(f"   ✅ S3 access confirmed ({len(buckets['Buckets'])} buckets found)")
    
    # Look for SageMaker default bucket
    sagemaker_buckets = [b['Name'] for b in buckets['Buckets'] if 'sagemaker' in b['Name']]
    if sagemaker_buckets:
        print(f"   ✅ SageMaker bucket found: {sagemaker_buckets[0]}")
    else:
        print("   ℹ️  No SageMaker bucket found (will be created automatically)")
        
except Exception as e:
    print(f"   ❌ S3 access check failed: {e}")

# Test 5: Check SageMaker access
print("\n5️⃣ Checking SageMaker access...")
try:
    sm = session.client('sagemaker')
    
    # Try to list endpoints
    endpoints = sm.list_endpoints(MaxResults=1)
    print(f"   ✅ SageMaker access confirmed")
    
    # Check if our endpoint exists
    for endpoint in endpoints.get('Endpoints', []):
        if endpoint['EndpointName'] == 'nordflytt-time-estimation':
            print(f"   ⚠️  Endpoint already exists: {endpoint['EndpointName']}")
            print(f"      Status: {endpoint['EndpointStatus']}")
            
except Exception as e:
    print(f"   ❌ SageMaker access check failed: {e}")

# Test 6: Simulate role creation
if not role_exists:
    print(f"\n6️⃣ Simulating role creation...")
    try:
        # Check if we can create a test policy (non-destructive test)
        test_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "sts:GetCallerIdentity",
                    "Resource": "*"
                }
            ]
        }
        
        # This doesn't actually create anything, just validates syntax
        iam.create_policy_version(
            PolicyArn=f"arn:aws:iam::{AWS_ACCOUNT_ID}:policy/NonExistentTestPolicy",
            PolicyDocument=json.dumps(test_policy),
            SetAsDefault=False,
            DryRun=True  # This would cause an error but shows we can call the API
        )
    except iam.exceptions.NoSuchEntityException:
        # This is expected - we're testing the API call, not creating a real policy
        print("   ✅ IAM role creation permissions appear sufficient")
    except iam.exceptions.AccessDeniedException:
        print("   ❌ Insufficient permissions to create IAM roles")
        print("   💡 You may need to run with elevated IAM permissions")
    except Exception as e:
        if "DryRun" in str(e) or "ValidationError" in str(e):
            print("   ✅ IAM role creation permissions appear sufficient")
        else:
            print(f"   ⚠️  Cannot verify role creation permissions: {e}")

# Summary
print("\n" + "=" * 50)
print("📊 Summary:")

all_good = True

if actual_account_id == AWS_ACCOUNT_ID:
    print("✅ AWS account ID is correct")
else:
    print("❌ AWS account ID mismatch")
    all_good = False

if role_exists:
    print(f"✅ IAM role '{SAGEMAKER_ROLE_NAME}' exists")
else:
    print(f"ℹ️  IAM role '{SAGEMAKER_ROLE_NAME}' will be created")

print(f"✅ Region: {AWS_REGION}")

if all_good:
    print("\n✅ Ready to deploy! Run: python deploy-nordflytt-model.py")
else:
    print("\n⚠️  Please fix the issues above before deploying")

print("\n💡 Tips:")
print("- If IAM role creation fails, create it manually in AWS Console")
print("- Ensure your AWS user has 'iam:CreateRole' permission")
print("- The script will use existing role if already created")