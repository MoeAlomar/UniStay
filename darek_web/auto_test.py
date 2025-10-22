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
    res = requests.post(f"{MESSAGING_URL}messages/send/", json=data, headers=headers)  # Assumes you added this endpoint as per earlier suggestion
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