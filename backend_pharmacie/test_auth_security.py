"""
Comprehensive authentication security tests.

Tests that the API properly enforces authentication and rejects unauthenticated requests.
"""

import requests
import json
from typing import Dict, Tuple

BASE_URL = "http://localhost:8000"

# ANSI color codes for output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_test(test_name: str):
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}🧪 TEST: {test_name}{Colors.ENDC}")


def print_result(passed: bool, message: str = ""):
    if passed:
        print(f"{Colors.OKGREEN}✅ PASSED{Colors.ENDC} {message}")
    else:
        print(f"{Colors.FAIL}❌ FAILED{Colors.ENDC} {message}")


def print_section(title: str):
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{Colors.ENDC}")


def test_unauthed_no_auth_header():
    """Test that /api/auth/me returns 401 without any auth"""
    print_test("No Authorization Header or Cookie")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            # NO headers, NO cookies
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        passed = response.status_code == 401
        print_result(passed, f"Expected 401, got {response.status_code}")
        return passed
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def test_unauthed_invalid_bearer():
    """Test that invalid Bearer token returns 401"""
    print_test("Invalid Bearer Token")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        passed = response.status_code == 401
        print_result(passed, f"Expected 401, got {response.status_code}")
        return passed
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def test_unauthed_malformed_header():
    """Test that malformed Authorization header returns 401"""
    print_test("Malformed Authorization Header (no Bearer prefix)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "invalid_token_12345"}  # Missing "Bearer"
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        passed = response.status_code == 401
        print_result(passed, f"Expected 401, got {response.status_code}")
        return passed
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def test_login_endpoint():
    """Test login endpoint to get valid token"""
    print_test("Login with Valid Credentials")
    
    try:
        # First, try to login with test credentials
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@pharmacie.local",
                "password": "secure_password_123"
            }
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Got tokens: access_token={data.get('access_token')[:20]}..., refresh_token={data.get('refresh_token')[:20]}...")
            return True, data.get('access_token')
        else:
            print(f"   Error: {response.json()}")
            return False, None
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False, None


def test_authed_with_bearer_token(token: str):
    """Test that valid Bearer token allows access"""
    print_test("Valid Bearer Token in Authorization Header")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        passed = response.status_code == 200
        print_result(passed, f"Expected 200, got {response.status_code}")
        return passed
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def test_authed_with_cookie(token: str):
    """Test that access_token cookie allows access"""
    print_test("Valid Token in access_token Cookie")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"access_token": token}
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        passed = response.status_code == 200
        print_result(passed, f"Expected 200, got {response.status_code}")
        return passed
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def test_admin_upload_unauthed():
    """Test that /admin/upload returns 401 without auth"""
    print_test("Admin Upload Endpoint Without Auth")
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/upload",
            files={"fichier": ("test.csv", "data")}
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        passed = response.status_code == 401
        print_result(passed, f"Expected 401, got {response.status_code}")
        return passed
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False


def run_all_tests():
    """Run all security tests"""
    print_section("AUTHENTICATION SECURITY TEST SUITE")
    print(f"Testing API at: {BASE_URL}")
    
    results = {}
    
    # Test 1: No authentication should return 401
    print_section("CRITICAL SECURITY TESTS - These MUST all fail (return 401)")
    results['no_auth'] = test_unauthed_no_auth_header()
    results['invalid_bearer'] = test_unauthed_invalid_bearer()
    results['malformed_header'] = test_unauthed_malformed_header()
    results['admin_unauthed'] = test_admin_upload_unauthed()
    
    # Test 2: Try to login for valid token
    print_section("LOGIN & AUTHENTICATED ACCESS TESTS")
    success, token = test_login_endpoint()
    
    if token:
        print_result(success, "Successfully obtained access token")
        results['valid_bearer'] = test_authed_with_bearer_token(token)
        results['valid_cookie'] = test_authed_with_cookie(token)
    else:
        print(f"{Colors.WARNING}⚠️  NOTICE: Could not obtain valid token. See 'test_fix_and_create_user.py' to create test user.{Colors.ENDC}")
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    
    for test_name, result in results.items():
        status = f"{Colors.OKGREEN}✅{Colors.ENDC}" if result else f"{Colors.FAIL}❌{Colors.ENDC}"
        print(f"  {status} {test_name}")
    
    # Critical check
    print_section("CRITICAL SECURITY STATUS")
    
    unauthenticated_blocked = all([
        results.get('no_auth', False),
        results.get('invalid_bearer', False),
        results.get('malformed_header', False),
        results.get('admin_unauthed', False)
    ])
    
    if unauthenticated_blocked:
        print(f"{Colors.OKGREEN}{Colors.BOLD}✅ SECURITY FIXED: All unauthenticated requests are properly blocked!{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}❌ SECURITY VULNERABILITY: Some unauthenticated requests are NOT blocked!{Colors.ENDC}")
    
    return results


if __name__ == "__main__":
    run_all_tests()
