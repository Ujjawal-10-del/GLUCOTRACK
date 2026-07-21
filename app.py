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

    return render_template(
        "dashboard.html",
        user=current_user
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
# Create Database Tables
# ==========================
with app.app_context():
    db.create_all()


# ==========================
# Run Application
# ==========================
if __name__ == "__main__":
    app.run(debug=True)