import requests
import jwt
import uuid

AUTH_URL = "http://127.0.0.1:8000/users/"
LISTINGS_URL = "http://127.0.0.1:8000/listings/"
ROOMATES_URL = "http://127.0.0.1:8000/roommates/"

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
        print("⚠️ User already exists. Username: {}, Email: {}".format(username, email))
        return None
    else:
        try:
            res.raise_for_status()
            print("✅ User created:", res.json())
            return res.json().get("id")
        except requests.exceptions.HTTPError as e:
            print("❌ Failed to register user:", res.status_code, res.text)
            raise

def get_user_id(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{AUTH_URL}profile/", headers=headers)
    try:
        res.raise_for_status()
        return res.json().get("id")
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to get user ID:", res.status_code, res.text)
        raise

def login_user(email, password):
    print(f"\n🔑 Logging in as {email}...")
    res = requests.post(f"{AUTH_URL}login/", json={
        "email": email,
        "password": password
    })
    try:
        res.raise_for_status()
        tokens = res.json()
        access_token = tokens["access"]
        refresh_token = tokens["refresh"]
        decoded = jwt.decode(access_token, options={"verify_signature": False})
        print("✅ Logged in. Role:", decoded.get("role", "Unknown"))
        user_id = get_user_id(access_token)
        return access_token, refresh_token, user_id
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to login:", res.status_code, res.text)
        raise

def create_listing(access_token, owner_id):
    print("\n🏠 Creating Listing...")
    headers = {"Authorization": f"Bearer {access_token}"}
    listing_data = {
        "owner": owner_id,
        "id_type": "National_ID",
        "owner_identification_id": "0000000000",
        "deed_number": "0000000000",
        "title": "Test Listing",
        "description": "A nice test apartment",
        "price": 1500.0,
        "type": "APARTMENT",
        "female_only": False,
        "roommates_allowed": True,
        "student_discount": True,
        "status": "AVAILABLE",
        "district": "ISHBILIYA",
        "location_link": "https://maps.example.com/test"
    }
    res = requests.post(LISTINGS_URL, json=listing_data, headers=headers)
    try:
        if res.status_code == 201:
            print("✅ Listing created:", res.json())
            return res.json().get("id")
        else:
            print("❌ Failed to create listing:", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to create listing:", res.status_code, res.text)
        raise

def create_roommate_post(access_token, user_id):
    print("\n📝 Creating Roommate Post...")
    headers = {"Authorization": f"Bearer {access_token}"}
    post_data = {
        "max_budget": 500.00,
        "preferred_type": "APARTMENT",
        "notes": "Looking for a quiet roommate",
        "female_only": False,
        "university": "Test University",
        "district": "ISHBILIYA"
    }
    res = requests.post(f"{ROOMATES_URL}posts/", json=post_data, headers=headers)
    try:
        if res.status_code == 201:
            print("✅ Roommate Post created:", res.json())
            return res.json().get("id")
        else:
            try:
                print("❌ Failed to create roommate post:", res.status_code, res.json())
            except requests.exceptions.JSONDecodeError:
                print("❌ Failed to create roommate post (non-JSON response):", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to create roommate post (exception):", res.status_code, res.text)
        raise

def create_roommate_request(access_token, receiver_id, post_id=None):
    print(f"\n🤝 Creating Roommate Request to user {receiver_id}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    request_data = {
        "receiver": receiver_id,
        "notes": "Interested in sharing an apartment",
    }
    if post_id:
        request_data["post"] = post_id
    res = requests.post(f"{ROOMATES_URL}requests/", json=request_data, headers=headers)
    try:
        if res.status_code == 201:
            print("✅ Roommate Request created:", res.json())
            return res.json().get("id")
        else:
            try:
                error = res.json()
                print("❌ Failed to create roommate request:", res.status_code, error)
                if res.status_code == 400 and "detail" in error and "already exists" in error["detail"]:
                    print("✅ Duplicate request detected as expected")
                    return None
                raise requests.exceptions.HTTPError(res)
            except requests.exceptions.JSONDecodeError:
                print("❌ Failed to create roommate request (non-JSON response):", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to create roommate request (exception):", res.status_code, res.text)
        raise

def accept_roommate_request(access_token, request_id):
    print(f"\n✅ Accepting Roommate Request {request_id}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.post(f"{ROOMATES_URL}requests/{request_id}/accept/", headers=headers)
    try:
        if res.status_code == 200:
            print("✅ Roommate Request accepted:", res.json())
            return res.json()
        else:
            try:
                print("❌ Failed to accept roommate request:", res.status_code, res.json())
            except requests.exceptions.JSONDecodeError:
                print("❌ Failed to accept roommate request (non-JSON response):", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to accept roommate request (exception):", res.status_code, res.text)
        raise

def reject_roommate_request(access_token, request_id):
    print(f"\n❌ Rejecting Roommate Request {request_id}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.post(f"{ROOMATES_URL}requests/{request_id}/reject/", headers=headers)
    try:
        if res.status_code == 200:
            print("✅ Roommate Request rejected:", res.json())
            return res.json()
        else:
            try:
                print("❌ Failed to reject roommate request:", res.status_code, res.json())
            except requests.exceptions.JSONDecodeError:
                print("❌ Failed to reject roommate request (non-JSON response):", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to reject roommate request (exception):", res.status_code, res.text)
        raise

def create_roommate_group(access_token, listing_id=None):
    print("\n👥 Creating Roommate Group...")
    headers = {"Authorization": f"Bearer {access_token}"}
    group_data = {
        "name": "Test Roommate Group",
        "university": "Test University",
        "max_members": 4,
        "female_only": False,
        "status": "OPEN"
    }
    if listing_id:
        group_data["listing"] = listing_id
    res = requests.post(f"{ROOMATES_URL}groups/", json=group_data, headers=headers)
    try:
        if res.status_code == 201:
            print("✅ Roommate Group created:", res.json())
            return res.json().get("id")
        else:
            try:
                print("❌ Failed to create roommate group:", res.status_code, res.json())
            except requests.exceptions.JSONDecodeError:
                print("❌ Failed to create roommate group (non-JSON response):", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to create roommate group (exception):", res.status_code, res.text)
        raise

# === RUN TEST FLOW ===
try:
    # Generate unique identifier for usernames and emails
    unique_id = uuid.uuid4().hex[:8]

    # Register and log in landlord with unique username
    landlord_username = f"landlord_{unique_id}"
    landlord_email = f"landlord_{unique_id}@example.com"
    landlord_id = register_user(landlord_username, "Landlord", "Test", landlord_email, "testpass", role="landlord")
    landlord_token, _, landlord_user_id = login_user(landlord_email, "testpass")

    # Create Listing as landlord
    listing_id = create_listing(landlord_token, landlord_user_id)

    # Register and log in two students with unique usernames
    student1_username = f"student1_{unique_id}"
    student1_email = f"student1_{unique_id}@example.edu.sa"
    student1_id = register_user(student1_username, "Student1", "Test", student1_email, "testpass", role="student")
    student1_token, _, student1_user_id = login_user(student1_email, "testpass")

    student2_username = f"student2_{unique_id}"
    student2_email = f"student2_{unique_id}@example.edu.sa"
    student2_id = register_user(student2_username, "Student2", "Test", student2_email, "testpass", role="student")
    student2_token, _, student2_user_id = login_user(student2_email, "testpass")

    # Create Roommate Post as student1
    post_id = create_roommate_post(student1_token, student1_user_id)

    # Create Roommate Request from student2 to student1
    request_id = create_roommate_request(student2_token, student1_user_id, post_id)

    # Test duplicate request prevention
    print("\n🧪 Testing duplicate roommate request prevention...")
    try:
        create_roommate_request(student2_token, student1_user_id, post_id)
    except requests.exceptions.HTTPError as e:
        print("✅ Duplicate prevented as expected:", str(e))

    # Accept Roommate Request as student1
    accept_response = accept_roommate_request(student1_token, request_id)
    group_id = accept_response.get('group_id') if accept_response else None

    # Create Roommate Group as student2
    group2_id = create_roommate_group(student2_token, listing_id)

    # Test rejecting a new request
    request2_id = create_roommate_request(student2_token, student1_user_id)
    reject_roommate_request(student1_token, request2_id)

except Exception as e:
    print(f"❌ Test failed: {str(e)}")