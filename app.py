import joblib
import pandas as pd

from flask import Flask, render_template, request, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user
)
from flask import make_response
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
login_manager.login_view = "login"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ==========================
# Home
# ==========================
@app.route("/")
def home():
    return "Welcome to Gluco Track!"


# ==========================
# Register
# ==========================
@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        fullname = request.form["fullname"]
        email = request.form["email"]
        password = request.form["password"]

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            return "Email already exists. Please use another email."

        hashed_password = generate_password_hash(password)

        new_user = User(
            full_name=fullname,
            email=email,
            password=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for("login"))

    return render_template("register.html")


# ==========================
# Login
# ==========================
@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):

            login_user(user)

            return redirect(url_for("dashboard"))

        return "Invalid Email or Password"

    return render_template("login.html")


# ==========================
# Dashboard
# ==========================
@app.route("/dashboard")
@login_required
def dashboard():

    predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).all()

    total_predictions = len(predictions)

    diabetic_count = Prediction.query.filter_by(
        user_id=current_user.id,
        prediction="Diabetic"
    ).count()

    non_diabetic_count = Prediction.query.filter_by(
        user_id=current_user.id,
        prediction="Non-Diabetic"
    ).count()

    if total_predictions > 0:
        average_risk_score = round(
            sum(p.risk_score for p in predictions) / total_predictions,
            2
        )
    else:
        average_risk_score = 0

    return render_template(
    "dashboard.html",
    user=current_user,
    total_predictions=total_predictions,
    diabetic_count=diabetic_count,
    non_diabetic_count=non_diabetic_count,
    average_risk_score=average_risk_score,

    pie_labels=["Diabetic", "Non-Diabetic"],
    pie_values=[diabetic_count, non_diabetic_count],

    risk_labels=[
        "Very Low Risk",
        "Low Risk",
        "Moderate Risk",
        "High Risk",
        "Very High Risk"
    ],

    risk_values=[
        Prediction.query.filter_by(user_id=current_user.id, risk_level="🟢 Very Low Risk").count(),
        Prediction.query.filter_by(user_id=current_user.id, risk_level="🟡 Low Risk").count(),
        Prediction.query.filter_by(user_id=current_user.id, risk_level="🟠 Moderate Risk").count(),
        Prediction.query.filter_by(user_id=current_user.id, risk_level="🔴 High Risk").count(),
        Prediction.query.filter_by(user_id=current_user.id, risk_level="🚨 Very High Risk").count(),
    ]
)

# ==========================
# Logout
# ==========================
@app.route("/logout")
@login_required
def logout():

    logout_user()

    return redirect(url_for("login"))

# ==========================
#Predict Diabetes
# ==========================
@app.route("/predict", methods=["GET", "POST"])
@login_required
def predict():

    if request.method == "POST":

        # --------------------------
        # Collect User Input
        # --------------------------
        data = {
            "Pregnancies": int(request.form["pregnancies"]),
            "Glucose": float(request.form["glucose"]),
            "BloodPressure": float(request.form["blood_pressure"]),
            "SkinThickness": float(request.form["skin_thickness"]),
            "Insulin": float(request.form["insulin"]),
            "BMI": float(request.form["bmi"]),
            "DiabetesPedigreeFunction": float(request.form["dpf"]),
            "Age": int(request.form["age"])
        }

        # --------------------------
        # Convert to DataFrame
        # --------------------------
        df = pd.DataFrame([data])

        # --------------------------
        # Feature Engineering
        # --------------------------

        # BMI Category
        df["BMI_Category"] = pd.cut(
            df["BMI"],
            bins=[0, 18.5, 25, 30, 100],
            labels=["Underweight", "Normal", "Overweight", "Obese"]
        ).cat.codes

        # Age Group
        df["Age_Group"] = pd.cut(
            df["Age"],
            bins=[20, 30, 40, 50, 100],
            labels=["21-30", "31-40", "41-50", "51+"]
        ).cat.codes

        # Arrange columns in the same order as training
        df = df[feature_names]

        # --------------------------
        # Prediction
        # --------------------------
        prediction = model.predict(df)[0]
        probabilities = model.predict_proba(df)[0]

        confidence = round(max(probabilities) * 100, 2)

        if prediction == 1:
            result = "Diabetic"
        else:
            result = "Non-Diabetic" 
         
        # --------------------------
        # Health Risk Score
        # --------------------------
        risk_score = 0

        # Glucose
        if data["Glucose"] >= 140:
            risk_score += 3

        # BMI
        if data["BMI"] >= 30:
            risk_score += 2

        # Blood Pressure
        if data["BloodPressure"] >= 90:
            risk_score += 1

        # Age
        if data["Age"] >= 45:
            risk_score += 1

        # Family History
        if data["DiabetesPedigreeFunction"] >= 0.5:
            risk_score += 2


        # --------------------------
        # Health Risk Level
        # --------------------------
        if risk_score <= 2:
            risk_level = "🟢 Very Low Risk"
        elif risk_score <= 4:
            risk_level = "🟡 Low Risk"
        elif risk_score <= 6:
            risk_level = "🟠 Moderate Risk"
        elif risk_score <= 8:
            risk_level = "🔴 High Risk"
        else:
            risk_level = "🚨 Very High Risk"
        print("Risk Score =", risk_score)
        print("Risk Level =", risk_level)
                # --------------------------
        # Key Risk Factors
        # --------------------------
        risk_factors = []

        if data["Glucose"] >= 140:
            risk_factors.append("High blood glucose level")

        if data["BMI"] >= 30:
            risk_factors.append("BMI indicates obesity")

        if data["Age"] >= 45:
            risk_factors.append("Age above 45 years")

        if data["DiabetesPedigreeFunction"] >= 0.5:
            risk_factors.append("Higher hereditary risk (Diabetes Pedigree Function)")

        if data["BloodPressure"] >= 90:
            risk_factors.append("Elevated blood pressure")

        if not risk_factors:
            risk_factors.append("No significant risk factors detected.")

        # --------------------------
        # Food Recommendations
        # --------------------------
        food_recommendations = []

        if data["Glucose"] >= 140:
            food_recommendations.append("Reduce sugary foods and sweetened beverages.")
            food_recommendations.append("Choose whole grains instead of refined carbohydrates.")

        if data["BMI"] >= 30:
            food_recommendations.append("Increase vegetables and fiber-rich foods.")
            food_recommendations.append("Limit high-calorie and processed foods.")

        if data["BloodPressure"] >= 90:
            food_recommendations.append("Reduce salt intake.")
            food_recommendations.append("Eat potassium-rich foods like bananas and spinach.")

        if not food_recommendations:
            food_recommendations.append("Maintain a balanced and nutritious diet.")

        # --------------------------
        # Lifestyle Recommendations
        # --------------------------
        lifestyle_recommendations = [
            "Exercise for at least 30 minutes most days of the week.",
            "Maintain a healthy body weight.",
            "Drink plenty of water.",
            "Sleep for 7–8 hours each night."
        ]

        if confidence >= 80:
            lifestyle_recommendations.append(
                "Consult a healthcare professional for further evaluation."
            )
        # --------------------------
        # Save Prediction to Database
        # --------------------------
        new_prediction = Prediction(
             user_id=current_user.id,

            pregnancies=data["Pregnancies"],
            glucose=data["Glucose"],
            blood_pressure=data["BloodPressure"],
            skin_thickness=data["SkinThickness"],
            insulin=data["Insulin"],
            bmi=data["BMI"],
            dpf=data["DiabetesPedigreeFunction"],
            age=data["Age"],
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
        # --------------------------
        # Show Prediction Report
        # --------------------------
        return render_template(
            "prediction_result.html",
            prediction=result,
            confidence=confidence,
             risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            food_recommendations=food_recommendations,
            lifestyle_recommendations=lifestyle_recommendations,
            
        )

    return render_template("predict.html")

# ==========================
# Prediction History page route
# ==========================
@app.route("/history")
@login_required
def history():

    predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.created_at.desc()
    ).all()

    return render_template(
        "history.html",
        predictions=predictions
    )
# ==========================
# View Single Prediction
# ==========================
@app.route("/history/<int:prediction_id>")
@login_required
def view_prediction(prediction_id):

    prediction = Prediction.query.filter_by(
        id=prediction_id,
        user_id=current_user.id
    ).first_or_404()

    return render_template(
        "view_prediction.html",
        prediction=prediction
    )         
# ==========================
# Download Prediction Report PDF
# ==========================
@app.route("/download/<int:prediction_id>")
@login_required
def download_prediction(prediction_id):

    prediction = Prediction.query.filter_by(
        id=prediction_id,
        user_id=current_user.id
    ).first_or_404()

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    story = []

    # ==========================
    # Report Header
    # ==========================
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

    for factor in prediction.risk_factors.split("\n"):
        story.append(Paragraph(f"• {factor}", styles["Normal"]))

  
    story.append(Paragraph("<br/><b>Food Recommendations</b>", styles["Heading2"]))

    for food in prediction.food_recommendations.split("\n"):
        story.append(Paragraph(f"• {food}", styles["Normal"]))

   
    story.append(Paragraph("<br/><b>Lifestyle Recommendations</b>", styles["Heading2"]))

    for tip in prediction.lifestyle_recommendations.split("\n"):
        story.append(Paragraph(f"• {tip}", styles["Normal"]))

    # ==========================
    # Disclaimer
    # ==========================
    story.append(Paragraph("<br/><b>Disclaimer</b>", styles["Heading2"]))

    story.append(
        Paragraph(
            "This report is generated using an AI-based diabetes prediction model for educational purposes only. "
            "It is not a substitute for professional medical diagnosis or treatment. "
            "Please consult a qualified healthcare professional for medical advice.",
            styles["Normal"]
        )
    )

    doc.build(story)

    pdf = buffer.getvalue()
    buffer.close()

    response = make_response(pdf)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = "attachment; filename=Gluco_Track_Report.pdf"

    return response
# ==========================
# Profile Page
# ==========================
@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():

    if request.method == "POST":

        current_user.full_name = request.form["fullname"]
        current_user.phone = request.form["phone"]
        current_user.gender = request.form["gender"]

        age = request.form["age"]
        height = request.form["height"]
        weight = request.form["weight"]

        current_user.age = int(age) if age else None
        current_user.height = float(height) if height else None
        current_user.weight = float(weight) if weight else None

        db.session.commit()

        return redirect(url_for("profile"))

    return render_template(
        "profile.html",
        user=current_user
    )


# ==========================
# Change Password Page
# ==========================
@app.route("/change-password", methods=["GET", "POST"])
@login_required
def change_password():

    if request.method == "POST":

        current_password = request.form["current_password"]
        new_password = request.form["new_password"]
        confirm_password = request.form["confirm_password"]

        # Check current password
        if not check_password_hash(current_user.password, current_password):
            return "Current password is incorrect."

        # Check new password confirmation
        if new_password != confirm_password:
            return "New passwords do not match."

        # Update password
        current_user.password = generate_password_hash(new_password)

        db.session.commit()

        return redirect(url_for("profile"))

    return render_template("change_password.html")

# ==========================
# Health Insights
# ==========================
@app.route("/insights")
@login_required
def insights():

    predictions = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.created_at.desc()
    ).all()

    return render_template(
        "insights.html",
        predictions=predictions
    )


# ==========================
# Overall Report Redirect
# ==========================
@app.route("/report")
@login_required
def report():

    latest_prediction = Prediction.query.filter_by(
        user_id=current_user.id
    ).order_by(
        Prediction.created_at.desc()
    ).first()

    if latest_prediction:
        return redirect(
            url_for(
                "download_prediction",
                prediction_id=latest_prediction.id
            )
        )

    return "No prediction report available."
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