# Automated Test Suite — Darek MVP
`auto_test1`, `auto_test2`, and `auto_test3` converted into a single Markdown test document with expected outputs and explanations.

---

# 1. Overview

This document contains three automated test scripts (in Python) used to validate core MVP features of the Darek platform:

- **auto_test1** — Listings and Reviews flow (register landlord/student, create listing, create review, test duplicate review prevention).  
- **auto_test2** — Messaging flow (register users, request Twilio token endpoint, create conversation, send messages, mark read).  
- **auto_test3** — Roommates flow (register landlord and students, create listing, roommate posts/requests/groups, accept/reject requests).

Each test block is followed by the **expected output** when the API behaves correctly and a short explanation for what is being validated.

---

# 2. auto_test1 — Listings & Reviews

```python
import requests
import jwt

AUTH_URL = "http://127.0.0.1:8000/users/"
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

def create_review(access_token, listing_id):
    print(f"\n💬 Creating Review for listing {listing_id}...")
    url = f"{REVIEWS_URL}listings/{listing_id}/"
    headers = {'Authorization': f'Bearer {access_token}'}
    payload = {
        "rating": 5,
        "comment": "Amazing place!"
    }
    res = requests.post(url, headers=headers, json=payload)
    try:
        if res.status_code == 201:
            review = res.json()
            print("✅ Review created:", review)
            return review["id"]
        else:
            try:
                error = res.json()
                print("❌ Failed to create review:", res.status_code, error)
                if res.status_code == 400 and "detail" in error and "already reviewed" in error["detail"]:
                    print("✅ Duplicate review detected as expected")
                    return None
                raise requests.exceptions.HTTPError(res)
            except requests.exceptions.JSONDecodeError:
                print("❌ Failed to create review (non-JSON response):", res.status_code, res.text)
                raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to create review (exception):", res.status_code, res.text)
        raise

def delete_listing(access_token, listing_id):
    print(f"\n🗑️ Deleting Listing {listing_id}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.delete(f"{LISTINGS_URL}{listing_id}/", headers=headers)
    if res.status_code == 204:
        print("✅ Listing deleted")
    else:
        print("❌ Failed to delete listing:", res.status_code, res.text)
        raise requests.exceptions.HTTPError(res)

# === RUN TEST FLOW ===
try:
    # Register and log in landlord
    landlord_email = "landlord@example.com"
    landlord_id = register_user("landlorduser", "Landlord", "Test", landlord_email, "testpass", role="landlord")
    landlord_token, _, landlord_user_id = login_user(landlord_email, "testpass")

    # Create Listing as landlord
    listing_id = create_listing(landlord_token, landlord_user_id)

    # Register and log in student (reviewer)
    student_email = "student@example.edu.sa"
    student_id = register_user("studentuser", "Student", "Test", student_email, "testpass", role="student")
    student_token, _, student_user_id = login_user(student_email, "testpass")

    # Create Review for the Listing as student
    review_id = create_review(student_token, listing_id)

    # Test duplicate review prevention
    print("\n🧪 Testing duplicate review prevention...")
    try:
        create_review(student_token, listing_id)
    except requests.exceptions.HTTPError as e:
        print("✅ Duplicate prevented as expected:", str(e))
finally:
    pass
```

## Expected output (if API behaves correctly)

```
🔐 Registering landlord@example.com as landlord...
✅ User created: {... landlord user JSON ...}
🔑 Logging in as landlord@example.com...
✅ Logged in. Role: landlord
🏠 Creating Listing...
✅ Listing created: {... listing JSON with "id": 123 ...}
🔐 Registering student@example.edu.sa as student...
✅ User created: {... student user JSON ...}
🔑 Logging in as student@example.edu.sa...
✅ Logged in. Role: student
💬 Creating Review for listing 123...
✅ Review created: {... review JSON with "id": 456 ...}
🧪 Testing duplicate review prevention...
✅ Duplicate prevented as expected: HTTPError(...)
```

### What this validates
- Registration and authentication endpoints work and return JWTs.  
- Listing creation endpoint returns `201 Created` with listing ID.  
- Review creation returns `201 Created`.  
- Duplicate review attempts are blocked (expected `400` with a helpful error or raised HTTPError).

---

# 3. auto_test2 — Messaging (Twilio-backed)

```python
import requests
import jwt

AUTH_URL = "http://127.0.0.1:8000/users/"
MESSAGING_URL = "http://127.0.0.1:8000/messaging/"

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

def get_twilio_token(access_token):
    print("\n🔑 Getting Twilio Access Token...")
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get(f"{MESSAGING_URL}twilio-token/", headers=headers)
    try:
        res.raise_for_status()
        token = res.json().get("token")
        print("✅ Twilio token obtained")
        return token
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to get Twilio token:", res.status_code, res.text)
        raise

def create_conversation(access_token, other_user_id):
    print(f"\n💬 Creating Conversation with user {other_user_id}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"other_user_id": other_user_id}
    res = requests.post(f"{MESSAGING_URL}conversations/create/", json=data, headers=headers)
    try:
        if res.status_code in [200, 201]:
            print("✅ Conversation created or found:", res.json())
            return res.json().get("conversation_sid")
        else:
            print("❌ Failed to create conversation:", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to create conversation (exception):", res.status_code, res.text)
        raise

def send_message(access_token, conversation_sid, body="Test message!"):
    print(f"\n📤 Sending Message to conversation {conversation_sid}...")
    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"conversation_sid": conversation_sid, "body": body}
    res = requests.post(f"{MESSAGING_URL}messages/send/", json=data, headers=headers)
    try:
        if res.status_code == 201:
            print("✅ Message sent:", res.json())
            return res.json().get("sid")
        else:
            print("❌ Failed to send message:", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to send message (exception):", res.status_code, res.text)
        raise

def mark_message_read(access_token, message_sid):
    print(f"\n📥 Marking Message {message_sid} as Read...")
    headers = {"Authorization": f"Bearer {access_token}"}
    data = {"message_sid": message_sid}
    res = requests.post(f"{MESSAGING_URL}messages/mark-read/", json=data, headers=headers)
    try:
        if res.status_code == 200:
            print("✅ Message marked as read:", res.json())
        else:
            print("❌ Failed to mark read:", res.status_code, res.text)
            raise requests.exceptions.HTTPError(res)
    except requests.exceptions.HTTPError as e:
        print("❌ Failed to mark read (exception):", res.status_code, res.text)
        raise

# === RUN TEST FLOW ===
try:
    # Register and log in student1 (initiator)
    student1_email = "student1@example.edu.sa"
    register_user("student1", "Student", "One", student1_email, "testpass", role="student")
    student1_token, _, student1_id = login_user(student1_email, "testpass")

    # Register and log in student2 (target for roommate chat) or landlord
    student2_email = "student2@example.edu.sa"
    register_user("student2", "Student", "Two", student2_email, "testpass", role="student")  # Or change to 'landlord' for testing that flow
    student2_token, _, student2_id = login_user(student2_email, "testpass")

    # Get Twilio tokens (for potential JS simulation, but here just to test endpoint)
    get_twilio_token(student1_token)
    get_twilio_token(student2_token)

    # Create Conversation as student1 with student2
    conversation_sid = create_conversation(student1_token, student2_id)

    # Test duplicate conversation prevention
    print("\n🧪 Testing duplicate conversation prevention...")
    try:
        create_conversation(student1_token, student2_id)
        print("✅ Returned existing conversation as expected")
    except requests.exceptions.HTTPError as e:
        print("❌ Unexpected error on duplicate:", str(e))

    # Send a message as student1 (assumes SendMessageView is implemented)
    send_message(student1_token, conversation_sid, "Hello from student1!")

    # Send a reply as student2
    send_message(student2_token, conversation_sid, "Hi back from student2!")

    message1_sid = send_message(student1_token, conversation_sid, "Hello from student1!")
    send_message(student2_token, conversation_sid, "Hi back from student2!")
    # Mark the first message as read by student2
    mark_message_read(student2_token, message1_sid)

    # Optionally: Add a fetch messages test if you have a get_messages endpoint
    # For now, manually check in admin or Twilio dashboard after running

except Exception as e:
    print("❌ Test flow failed:", str(e))
finally:
    print("\n🧹 Cleanup: In a real test, delete test users/conversations if needed")
```

## Expected output (if API behaves correctly)

```
🔐 Registering student1@example.edu.sa as student...
✅ User created: {... student1 JSON ...}
🔑 Logging in as student1@example.edu.sa...
✅ Logged in. Role: student
🔐 Registering student2@example.edu.sa as student...
✅ User created: {... student2 JSON ...}
🔑 Logging in as student2@example.edu.sa...
✅ Logged in. Role: student
🔑 Getting Twilio Access Token...
✅ Twilio token obtained
💬 Creating Conversation with user 42...
✅ Conversation created or found: {... "conversation_sid": "CHxx..." ...}
🧪 Testing duplicate conversation prevention...
✅ Returned existing conversation as expected
📤 Sending Message to conversation CHxx...
✅ Message sent: {... "sid": "IMxx..." ...}
📥 Marking Message IMxx... as Read...
✅ Message marked as read: {...}
🧹 Cleanup: In a real test, delete test users/conversations if needed
```

### What this validates
- Messaging endpoints exist (twilio-token, conversations/create, messages/send, messages/mark-read).  
- Duplicate conversation prevention works (returns existing conversation).  
- Sending messages returns `201 Created` and message `sid`.  
- Marking reads returns `200 OK`.

---

# 4. auto_test3 — Roommates & Groups

```python
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
```

## Expected output (if API behaves correctly)

```
🔐 Registering landlord_<id>@example.com as landlord...
✅ User created: {... landlord user JSON ...}
🔑 Logging in as landlord_<id>@example.com...
✅ Logged in. Role: landlord
🏠 Creating Listing...
✅ Listing created: {... listing JSON with "id": 123 ...}
🔐 Registering student1_<id>@example.edu.sa as student...
✅ User created: {... student1 JSON ...}
🔑 Logging in as student1_<id>@example.edu.sa...
✅ Logged in. Role: student
🔐 Registering student2_<id>@example.edu.sa as student...
✅ User created: {... student2 JSON ...}
🔑 Logging in as student2_<id>@example.edu.sa...
✅ Logged in. Role: student
📝 Creating Roommate Post...
✅ Roommate Post created: {... post JSON with "id": 789 ...}
🤝 Creating Roommate Request to user <student1_id>...
✅ Roommate Request created: {... request JSON with "id": 555 ...}
🧪 Testing duplicate roommate request prevention...
✅ Duplicate prevented as expected: HTTPError(...)
✅ Accepting Roommate Request 555...
✅ Roommate Request accepted: {... "group_id": 999 ...}
👥 Creating Roommate Group...
✅ Roommate Group created: {... group JSON with "id": 1001 ...}
🤝 Creating Roommate Request to user <student1_id>...
✅ Roommate Request created: {... request JSON ...}
❌ Rejecting Roommate Request <id>...
✅ Roommate Request rejected: {...}
```

### What this validates
- Roommate posts can be created and returned with `201 Created`.  
- Roommate requests are created, duplicates are blocked, and requests can be accepted or rejected.  
- Accepting a request returns group information (e.g., `group_id`) to join/create roommate groups.  

---

# 5. Final Integration and QA Testing (mandatory)

**Purpose:** To ensure all components work together seamlessly and meet quality standards.

**Instructions:**

1. **Conduct integration tests** to verify end-to-end functionality of the MVP:
   - Run automated tests (the three scripts above) against a clean staging environment.
   - Run manual exploratory tests for edge cases not covered by automation (e.g., invalid inputs, race conditions).
2. **QA executes the final test plan** (manual + automated):
   - Verify authentication flows, RBAC (roles student/landlord/admin), and protected endpoints.
   - Verify database integrity after create/update/delete cycles.
   - Verify third‑party integrations: Twilio tokens, webhooks, external map links.
3. **Fix critical bugs or performance issues** discovered during tests:
   - Triage bugs by severity and deploy hotfixes to staging for verification.
4. **Performance & load testing** (recommended for search and messaging endpoints):
   - Add DB indexes, run load tests (e.g., using locust or k6) and confirm acceptable response times under expected concurrency.
5. **Security checks:** Basic checks before release:
   - Ensure JWT secrets and other sensitive configs are not exposed.
   - Do not log raw OTPs; comply with privacy requirements for verification flows.
6. **Documentation & cleanup:**
   - Remove test users/data or add a test-data cleanup script.
   - Update README with endpoints that the automated tests call and any environment variables required.

**Example**

For a web app: Verify the front-end correctly integrates with the back-end APIs. Ensure all database operations perform as expected under various conditions (create/update/delete), and that error handling and status codes follow the API contract.

---

# 6. How to use these scripts safely

- Run against a **local or staging** instance, never production.  
- Consider adding a small teardown/cleanup step to remove test artefacts.  
- Use unique identifiers (UUIDs) for test accounts to avoid collisions.  
- Add retries/backoff if tests hit transient network errors.  
- Capture logs and save failing HTTP responses for debugging.

---

# 7. Files

- `auto_test1.py` — Listings & Reviews (copy the code above into a file)  
- `auto_test2.py` — Messaging (copy the code above into a file)  
- `auto_test3.py` — Roommates & Groups (copy the code above into a file)  

---

# 8. Notes & Tips

- If any test fails, copy the printed HTTP response body and status code — it usually contains the cause.  
- For Twilio flows, check the Twilio console to confirm conversations/messages were created.  
- When running tests repeatedly, either delete created objects or use unique emails/usernames to avoid duplicate errors.

---
