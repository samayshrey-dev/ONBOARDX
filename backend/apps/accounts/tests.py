from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.permissions import IsPartner, IsReviewer, IsAdminRole, IsOwnerOrStaff

User = get_user_model()

class AuthenticationAndPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_partner_registration_and_jwt_issuance(self):
        payload = {
            'username': 'acme_partner',
            'email': 'partner@acme.com',
            'password': 'PartnerPassword123!',
            'first_name': 'Acme',
            'last_name': 'Corp',
            'company_name': 'Acme Corporation',
            'role': 'PARTNER'
        }
        response = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['role'], 'PARTNER')

    def test_login_and_token_refresh(self):
        # Create user
        user = User.objects.create_user(
            username='john_reviewer',
            password='ReviewerPass123!',
            role='REVIEWER'
        )

        # Login
        login_res = self.client.post('/api/v1/auth/login/', {
            'username': 'john_reviewer',
            'password': 'ReviewerPass123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['access']
        refresh_token = login_res.data['refresh']

        # Fetch profile using Bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_res = self.client.get('/api/v1/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'john_reviewer')
        self.assertEqual(me_res.data['role'], 'REVIEWER')

        # Refresh token
        self.client.credentials() # Reset headers
        refresh_res = self.client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_token
        })
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_res.data)

    def test_unauthenticated_request_rejected(self):
        # Request without token should return 401 Unauthorized
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_token(self):
        user = User.objects.create_user(username='logout_test', password='Password123!')
        login_res = self.client.post('/api/v1/auth/login/', {'username': 'logout_test', 'password': 'Password123!'})
        access = login_res.data['access']
        refresh = login_res.data['refresh']

        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        logout_res = self.client.post('/api/v1/auth/logout/', {'refresh': refresh})
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Trying to use blacklisted refresh token should fail
        refresh_retry = self.client.post('/api/v1/auth/token/refresh/', {'refresh': refresh})
        self.assertEqual(refresh_retry.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_permission_classes(self):
        partner = User.objects.create_user(username='p_user', role='PARTNER')
        reviewer = User.objects.create_user(username='r_user', role='REVIEWER')
        admin = User.objects.create_user(username='a_user', role='ADMIN')

        # Request mocks
        class MockRequest:
            def __init__(self, user):
                self.user = user

        # Test IsPartner
        self.assertTrue(IsPartner().has_permission(MockRequest(partner), None))
        self.assertFalse(IsPartner().has_permission(MockRequest(reviewer), None))

        # Test IsReviewer
        self.assertFalse(IsReviewer().has_permission(MockRequest(partner), None))
        self.assertTrue(IsReviewer().has_permission(MockRequest(reviewer), None))
        self.assertTrue(IsReviewer().has_permission(MockRequest(admin), None))

        # Test IsAdminRole
        self.assertFalse(IsAdminRole().has_permission(MockRequest(partner), None))
        self.assertFalse(IsAdminRole().has_permission(MockRequest(reviewer), None))
        self.assertTrue(IsAdminRole().has_permission(MockRequest(admin), None))

    def test_password_reset_flow(self):
        user = User.objects.create_user(
            username='reset_user',
            email='reset@example.com',
            password='OldPassword123!'
        )
        
        # 1. Request password reset token
        reset_req = self.client.post('/api/v1/auth/password-reset/', {
            'email': 'reset@example.com'
        })
        self.assertEqual(reset_req.status_code, status.HTTP_200_OK)
        self.assertIn('uidb64', reset_req.data)
        self.assertIn('token', reset_req.data)

        uidb64 = reset_req.data['uidb64']
        token = reset_req.data['token']

        # 2. Confirm password reset
        confirm_res = self.client.post('/api/v1/auth/password-reset-confirm/', {
            'uidb64': uidb64,
            'token': token,
            'new_password': 'NewSecurePassword123!'
        })
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        # 3. Verify login with new password works
        login_res = self.client.post('/api/v1/auth/login/', {
            'username': 'reset_user',
            'password': 'NewSecurePassword123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

