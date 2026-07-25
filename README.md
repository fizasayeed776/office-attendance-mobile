# Office Attendance — Mobile App (React Native / Expo)

Employee self-service companion app for the existing Django Office Attendance
Management System. **Uses the exact same Django backend and database as the
website** — no separate backend, no data duplication.

## How it connects to the existing backend

- The website authenticates with a session cookie. The phone can't hold a
  browser cookie jar the same way, so the mobile app authenticates with a
  **token** instead (`Authorization: Token <key>` header), obtained from
  `POST /api/mobile/login/`.
- A small Django middleware (`core/middleware.py` on the backend) recognizes
  that header and makes ~30 existing endpoints work for the app completely
  unmodified — leave, corrections, attendance, reports, face recognition —
  all the same JSON APIs the website already calls.
- The website's own login/session flow is **completely untouched** by any of
  this.

## Features implemented

| Feature | Screen | Backend endpoint(s) |
|---|---|---|
| Login | `LoginScreen` | `POST /api/mobile/login/` |
| Dashboard | `DashboardScreen` | `GET /api/mobile/dashboard/` |
| Face recognition check-in/out | `FaceAttendanceScreen` | `POST /api/recognize/` |
| Attendance history | `AttendanceHistoryScreen` | `GET /api/attendance/` |
| Monthly summary | `AttendanceHistoryScreen` | `GET /api/reports/summary/` |
| Leave application + status | `LeavesScreen` | `GET/POST /api/leaves/` |
| Attendance correction requests | `CorrectionsScreen` | `GET/POST /api/corrections/` |
| Profile | `ProfileScreen` | (from dashboard payload) |
| Push notifications | `notifications.ts` | `POST /api/mobile/register-device/` |
| GPS location on check-in (optional) | `FaceAttendanceScreen` | sent to `/api/recognize/`, only enforced if an admin configures an `OfficeLocation` in Django |

## Setup

1. **Backend**: on the Django server, make sure you've run the latest
   migration (`0006_mobile_app_support`) — `python manage.py migrate`. No
   other backend setup is required; the mobile endpoints are already wired
   into the existing `core/urls.py`.

2. **Point the app at your server**: edit `app.json` →
   `expo.extra.apiBaseUrl`. Use your machine's LAN IP (not `localhost`) if
   testing on a physical phone, e.g. `http://192.168.1.50:8000`. Make sure
   Django's `CSRF_TRUSTED_ORIGINS` / `ALLOWED_HOSTS` allow that address (the
   existing `settings.py` already has `ALLOWED_HOSTS = ['*']` for
   development).

3. **Install & run**:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
   Scan the QR code with **Expo Go** (Android/iOS) for the fastest way to
   test on a real device — this is required for camera + push notifications
   to work (simulators don't support push, and the iOS simulator has no
   camera feed).

4. **Login**: use an employee account that has already completed the
   "Set up your login" self-service flow on the website (same
   username/password — this is one login system, not two).

## Notes / things to configure before production

- `app.json` → `ios.bundleIdentifier` / `android.package`: change from the
  placeholder `com.yourcompany.attendance` to your real identifiers.
- HTTPS: use a real HTTPS domain for `apiBaseUrl` in production — plain HTTP
  works for local dev only, and iOS blocks non-HTTPS by default (App
  Transport Security) unless you add an exception for local testing.
- Push notifications work out of the box with Expo's push service for
  development. For a production build you'll eventually want an
  [EAS Build](https://docs.expo.dev/build/introduction/) with your own
  Apple/Google push credentials — Expo's docs walk through this when you're
  ready to publish to the App Store / Play Store.
- Geofencing is **off by default** — it only activates if an admin creates
  an `OfficeLocation` row in the Django admin panel (`/admin/`). Until then,
  GPS coordinates are sent but never enforced, exactly like the website's
  camera-only kiosk flow.
