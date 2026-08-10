import joblib
import pandas as pd
from datetime import datetime

from flask import Flask, request, jsonify, make_response
from werkzeug.security import generate_password_hash, check_password_hash

from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user
)
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

from models import db, User, Prediction

app = Flask(__name__)
# ==========================
# Configuration
# ==========================
app.config["SECRET_KEY"] = "gluco_track_secret_key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ==========================
# Initialize Database
# ==========================
db.init_app(app)
# ==========================
# Load Machine Learning Model
# ==========================
model = joblib.load("model.pkl")
feature_names = joblib.load("features.pkl")
# ==========================
# Flask Login Configuration
# ==========================
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized"}), 401

# ==========================
# CORS Configuration
# ==========================
@app.after_request
def after_request(response):
    # Allow the React dev server
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# ==========================
# Auth Status Check
# ==========================
@app.route("/auth/status")
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True, 
            "user": {
                "id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "role": current_user.role,
            }
        })
    return jsonify({"authenticated": False})

# ==========================
# Register
# ==========================
@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return {}, 200
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    fullname = data.get("fullname")
    email = data.get("email")
    password = data.get("password")

    if not fullname or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(
        full_name=fullname,
        email=email,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registration successful"}), 201

# ==========================
# Login
# ==========================
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return {}, 200
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role
            }
        }), 200

    return jsonify({"error": "Invalid Email or Password"}), 401

# ==========================
# Logout
# ==========================
@app.route("/logout", methods=["POST", "OPTIONS"])
@login_required
def logout():
    if request.method == "OPTIONS":
        return {}, 200
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

# ==========================
# Dashboard Data
# ==========================
@app.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    predictions = Prediction.query.filter_by(user_id=current_user.id).all()
    total_predictions = len(predictions)

    diabetic_count = sum(1 for p in predictions if p.prediction == "Diabetic")
    non_diabetic_count = total_predictions - diabetic_count

    if total_predictions > 0:
        average_risk_score = round(sum(p.risk_score for p in predictions) / total_predictions, 2)
    else:
        average_risk_score = 0

    return jsonify({
        "total_predictions": total_predictions,
        "diabetic_count": diabetic_count,
        "non_diabetic_count": non_diabetic_count,
        "average_risk_score": average_risk_score,
        "risk_distribution": [
            {"name": "Very Low Risk", "value": sum(1 for p in predictions if p.risk_level == "Very Low Risk")},
            {"name": "Low Risk", "value": sum(1 for p in predictions if p.risk_level == "Low Risk")},
            {"name": "Moderate Risk", "value": sum(1 for p in predictions if p.risk_level == " Moderate Risk")},
            {"name": "High Risk", "value": sum(1 for p in predictions if p.risk_level == " High Risk")},
            {"name": "Very High Risk", "value": sum(1 for p in predictions if p.risk_level == "Very High Risk")}
        ]
    })

# ==========================
# Predict Diabetes
# ==========================
@app.route("/predict", methods=["POST", "OPTIONS"])
@login_required
def predict():
    if request.method == "OPTIONS":
        return {}, 200
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        input_data = {
            "Pregnancies": int(data["pregnancies"]),
            "Glucose": float(data["glucose"]),
            "BloodPressure": float(data["blood_pressure"]),
            "SkinThickness": float(data["skin_thickness"]),
            "Insulin": float(data["insulin"]),
            "BMI": float(data["bmi"]),
            "DiabetesPedigreeFunction": float(data["dpf"]),
            "Age": int(data["age"])
        }
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Invalid or missing input: {str(e)}"}), 400

    df = pd.DataFrame([input_data])

    # Feature Engineering
    df["BMI_Category"] = pd.cut(
        df["BMI"],
        bins=[0, 18.5, 25, 30, 100],
        labels=["Underweight", "Normal", "Overweight", "Obese"]
    ).cat.codes

    df["Age_Group"] = pd.cut(
        df["Age"],
        bins=[20, 30, 40, 50, 100],
        labels=["21-30", "31-40", "41-50", "51+"]
    ).cat.codes

    # Ensure columns match training order
    df = df[feature_names]

    # Prediction
    prediction = model.predict(df)[0]
    probabilities = model.predict_proba(df)[0]
    confidence = round(max(probabilities) * 100, 2)
    result = "Diabetic" if prediction == 1 else "Non-Diabetic"

    # Health Risk Score
    risk_score = 0
    if input_data["Glucose"] >= 140: risk_score += 3
    if input_data["BMI"] >= 30: risk_score += 2
    if input_data["BloodPressure"] >= 90: risk_score += 1
    if input_data["Age"] >= 45: risk_score += 1
    if input_data["DiabetesPedigreeFunction"] >= 0.5: risk_score += 2

    # Health Risk Level
    if risk_score <= 2:
        risk_level = "Very Low Risk"
    elif risk_score <= 4:
        risk_level = "Low Risk"
    elif risk_score <= 6:
        risk_level = " Moderate Risk"
    elif risk_score <= 8:
        risk_level = " High Risk"
    else:
        risk_level = "Very High Risk"

    # Key Risk Factors
    risk_factors = []
    if input_data["Glucose"] >= 140: risk_factors.append("High blood glucose level")
    if input_data["BMI"] >= 30: risk_factors.append("BMI indicates obesity")
    if input_data["Age"] >= 45: risk_factors.append("Age above 45 years")
    if input_data["DiabetesPedigreeFunction"] >= 0.5: risk_factors.append("Higher hereditary risk (Diabetes Pedigree Function)")
    if input_data["BloodPressure"] >= 90: risk_factors.append("Elevated blood pressure")
    if not risk_factors: risk_factors.append("No significant risk factors detected.")

    # Food Recommendations
    food_recommendations = []
    if input_data["Glucose"] >= 140:
        food_recommendations.extend(["Reduce sugary foods and sweetened beverages.", "Choose whole grains instead of refined carbohydrates."])
    if input_data["BMI"] >= 30:
        food_recommendations.extend(["Increase vegetables and fiber-rich foods.", "Limit high-calorie and processed foods."])
    if input_data["BloodPressure"] >= 90:
        food_recommendations.extend(["Reduce salt intake.", "Eat potassium-rich foods like bananas and spinach."])
    if not food_recommendations:
        food_recommendations.append("Maintain a balanced and nutritious diet.")

    # Lifestyle Recommendations
    lifestyle_recommendations = [
        "Exercise for at least 30 minutes most days of the week.",
        "Maintain a healthy body weight.",
        "Drink plenty of water.",
        "Sleep for 7–8 hours each night."
    ]
    if confidence >= 80:
        lifestyle_recommendations.append("Consult a healthcare professional for further evaluation.")

    # Save to DB
    new_prediction = Prediction(
        user_id=current_user.id,
        pregnancies=input_data["Pregnancies"],
        glucose=input_data["Glucose"],
        blood_pressure=input_data["BloodPressure"],
        skin_thickness=input_data["SkinThickness"],
        insulin=input_data["Insulin"],
        bmi=input_data["BMI"],
        dpf=input_data["DiabetesPedigreeFunction"],
        age=input_data["Age"],
        prediction=result,
        confidence=confidence,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_factors="\n".join(risk_factors),
        food_recommendations="\n".join(food_recommendations),
        lifestyle_recommendations="\n".join(lifestyle_recommendations)
    )

    db.session.add(new_prediction)
    db.session.commit()

    return jsonify({
        "id": new_prediction.id,
        "prediction": result,
        "confidence": confidence,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "food_recommendations": food_recommendations,
        "lifestyle_recommendations": lifestyle_recommendations
    }), 201

# ==========================
# Prediction History
# ==========================
@app.route("/history", methods=["GET"])
@login_required
def history():
    predictions = Prediction.query.filter_by(user_id=current_user.id).order_by(Prediction.created_at.desc()).all()
    
    result = []
    for p in predictions:
        result.append({
            "id": p.id,
            "prediction": p.prediction,
            "confidence": p.confidence,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "created_at": p.created_at.isoformat()
        })
    return jsonify(result)

# ==========================
# View Single Prediction
# ==========================
@app.route("/history/<int:prediction_id>", methods=["GET"])
@login_required
def view_prediction(prediction_id):
    prediction = Prediction.query.filter_by(id=prediction_id, user_id=current_user.id).first_or_404()
    return jsonify({
        "id": prediction.id,
        "pregnancies": prediction.pregnancies,
        "glucose": prediction.glucose,
        "blood_pressure": prediction.blood_pressure,
        "skin_thickness": prediction.skin_thickness,
        "insulin": prediction.insulin,
        "bmi": prediction.bmi,
        "dpf": prediction.dpf,
        "age": prediction.age,
        "prediction": prediction.prediction,
        "confidence": prediction.confidence,
        "risk_score": prediction.risk_score,
        "risk_level": prediction.risk_level,
        "risk_factors": prediction.risk_factors.split('\n') if prediction.risk_factors else [],
        "food_recommendations": prediction.food_recommendations.split('\n') if prediction.food_recommendations else [],
        "lifestyle_recommendations": prediction.lifestyle_recommendations.split('\n') if prediction.lifestyle_recommendations else [],
        "created_at": prediction.created_at.isoformat()
    })

# ==========================
# Profile Actions
# ==========================
@app.route("/profile", methods=["GET", "POST", "OPTIONS"])
@login_required
def profile():
    if request.method == "OPTIONS":
        return {}, 200
        
    if request.method == "POST":
        data = request.get_json()
        current_user.full_name = data.get("fullname", current_user.full_name)
        current_user.phone = data.get("phone", current_user.phone)
        current_user.gender = data.get("gender", current_user.gender)

        age = data.get("age")
        height = data.get("height")
        weight = data.get("weight")

        current_user.age = int(age) if age else current_user.age
        current_user.height = float(height) if height else current_user.height
        current_user.weight = float(weight) if weight else current_user.weight

        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200

    return jsonify({
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "gender": current_user.gender,
        "age": current_user.age,
        "height": current_user.height,
        "weight": current_user.weight
    })

@app.route("/change-password", methods=["POST", "OPTIONS"])
@login_required
def change_password():
    if request.method == "OPTIONS":
        return {}, 200
        
    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not check_password_hash(current_user.password, current_password):
        return jsonify({"error": "Current password is incorrect"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "New passwords do not match"}), 400

    current_user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully"}), 200

# ==========================
# Download Prediction Report PDF
# ==========================
@app.route("/download/<int:prediction_id>")
@login_required
def download_prediction(prediction_id):
    prediction = Prediction.query.filter_by(id=prediction_id, user_id=current_user.id).first_or_404()
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>🩺 GLUCO TRACK</b>", styles["Title"]))
    story.append(Paragraph("<b>AI Diabetes Prediction Report</b>", styles["Heading2"]))
    story.append(Paragraph("<br/>", styles["Normal"]))
    story.append(Paragraph(f"<b>Patient Name:</b> {current_user.full_name}", styles["Normal"]))
    story.append(Paragraph(f"<b>Email:</b> {current_user.email}", styles["Normal"]))
    story.append(Paragraph(f"<b>Report Date:</b> {prediction.created_at.strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    story.append(Paragraph("<br/>", styles["Normal"]))
    story.append(Paragraph("<b>Prediction Summary</b>", styles["Heading2"]))
    story.append(Paragraph(f"<b>Prediction:</b> {prediction.prediction}", styles["Normal"]))
    story.append(Paragraph(f"<b>Confidence:</b> {prediction.confidence}%", styles["Normal"]))
    story.append(Paragraph(f"<b>Risk Score:</b> {prediction.risk_score}/9", styles["Normal"]))
    story.append(Paragraph(f"<b>Risk Level:</b> {prediction.risk_level}", styles["Normal"]))

    story.append(Paragraph("<br/><b>Risk Factors</b>", styles["Heading2"]))
    if prediction.risk_factors:
        for factor in prediction.risk_factors.split("\n"):
            story.append(Paragraph(f"• {factor}", styles["Normal"]))

    story.append(Paragraph("<br/><b>Food Recommendations</b>", styles["Heading2"]))
    if prediction.food_recommendations:
        for food in prediction.food_recommendations.split("\n"):
            story.append(Paragraph(f"• {food}", styles["Normal"]))

    story.append(Paragraph("<br/><b>Lifestyle Recommendations</b>", styles["Heading2"]))
    if prediction.lifestyle_recommendations:
        for tip in prediction.lifestyle_recommendations.split("\n"):
            story.append(Paragraph(f"• {tip}", styles["Normal"]))

    story.append(Paragraph("<br/><b>Disclaimer</b>", styles["Heading2"]))
    story.append(Paragraph(
        "This report is generated using an AI-based diabetes prediction model for educational purposes only. "
        "It is not a substitute for professional medical diagnosis or treatment. "
        "Please consult a qualified healthcare professional for medical advice.",
        styles["Normal"]
    ))

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()

    response = make_response(pdf)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename=Gluco_Track_Report_{prediction_id}.pdf"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    
    return response

# ==========================
# Create Database Tables
# ==========================
with app.app_context():
    db.create_all()

# ==========================
# Run Application
# ==========================
if __name__ == "__main__":
    app.run(debug=True)