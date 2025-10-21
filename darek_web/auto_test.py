import requests
import jwt

AUTH_URL = "http://127.0.0.1:8000/users/"  # Updated base to /users/
LISTINGS_URL = "http://127.0.0.1:8000/listings/"
REVIEWS_URL = "http://127.0.0.1:8000/reviews/"

def register_user(username, first_name, last_name, email, password, role='student', gender='male', phone='+966123456789'):
    print(f"\n🔐 Registering {email} as {role}...")
    data = {
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": password,
        "role": role,
        "gender": gender,
        "phone": phone
    }
    res = requests.post(f"{AUTH_URL}register/", json=data)
    if res.status_code == 400:
        print("⚠️ User already exists or validation error. Continuing...")
        print(res.json())
    else:
        res.raise_for_status()
        print("✅ User created:", res.json())
    return res.json().get("id")

def login_user(email, password):
    print(f"\n🔑 Logging in as {email}...")
    res = requests.post(f"{AUTH_URL}login/", json={
        "email": email,
        "password": password
    })
    res.raise_for_status()
    tokens = res.json()
    access_token = tokens["access"]
    refresh_token = tokens["refresh"]
    decoded = jwt.decode(access_token, options={"verify_signature": False})
    print("✅ Logged in. Role:", decoded.get("role", "Unknown"))
    return access_token, refresh_token, decoded["user_id"]

def create_listing(access_token, owner_id):
    print("\n🏠 Creating Listing...")
    headers = {"Authorization": f"Bearer {access_token}"}
    listing_data = {
        "owner": owner_id,  # Required: User ID as PrimaryKey
        "id_type": "National_ID",
        "owner_identification_id": "0000000000",  # Bypass value
        "deed_number": "0000000000",  # Bypass value
        "title": "Test Listing",
        "description": "A nice test apartment",
        "price": 1500.0,
        "type": "APARTMENT",
        "female_only": False,
        "roommates_allowed": True,
        "student_discount": True,
        "status": "AVAILABLE",
        "district": "ISHBILIYA",  # Valid choice; adjust if your districts list uses a different format (e.g., check admin dropdown for exact string)
        "location_link": "https://maps.example.com/test"
    }
    res = requests.post(LISTINGS_URL, json=listing_data, headers=headers)
    if res.status_code == 201:
        print("✅ Listing created:", res.json())
        return res.json().get("id")
    else:
        print("❌ Failed to create listing:", res.status_code, res.json())
        res.raise_for_status()

def create_review(access_token, listing_id):
    print(f"\n💬 Creating Review for listing {listing_id}...")
    url = f"{REVIEWS_URL}listings/{listing_id}/"
    headers = {'Authorization': f'Bearer {access_token}'}
    payload = {
        "rating": 5,
        "comment": "Amazing place!"
    }
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 201:
        review = res.json()
        print("✅ Review created:", review)
        return review["id"]
    else:
        try:
            print("❌ Failed to create review:", res.status_code, res.json())
        except Exception:
            print("❌ Failed to create review:", res.status_code, res.text)
        res.raise_for_status()

# === RUN TEST FLOW ===

# Register and log in landlord
landlord_email = "landlord@example.com"
landlord_id = register_user("landlorduser", "Landlord", "Test", landlord_email, "testpass", role="landlord")
landlord_token, _, landlord_user_id = login_user(landlord_email, "testpass")

# Create Listing as landlord
listing_id = create_listing(landlord_token, landlord_user_id)

# Register and log in student (reviewer)
student_email = "student@example.edu.sa"  # .edu.sa for student
student_id = register_user("studentuser", "Student", "Test", student_email, "testpass", role="student")
student_token, _, student_user_id = login_user(student_email, "testpass")

# Create Review for the Listing as student
review_id = create_review(student_token, listing_id)

# Optional: Try duplicate review to test uniqueness
print("\n🧪 Testing duplicate review prevention...")
try:
    create_review(student_token, listing_id)
except requests.exceptions.HTTPError as e:
    print("✅ Duplicate prevented as expected:", str(e))