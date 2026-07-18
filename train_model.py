import pandas as pd 
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
    cross_validate,
    GridSearchCV
)
# Load the dataset
data = pd.read_csv("diabetes.csv")

# Display the first 5 rows
print("\nFirst 5 rows of the dataset:")
print(data.head())

# Display information about the dataset
print("\nDataset Information:")
print(data.info())

# Display statistical summary
print("\nStatistical Summary:")
print(data.describe())

# Count diabetic and non-diabetic cases
print("\nOutcome Count:")
print(data["Outcome"].value_counts())

# Check for zero values in important columns

columns = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

print("\nZero values in important columns:")

for column in columns:
    print(f"{column}: {(data[column] == 0).sum()}") 


# .......................FEATURE ENGINEERING......................

#.................... Columns where zero is considered missing
columns = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

# MEDIAN 
for column in columns:
    median = data[column].median()
    data[column] = data[column].replace(0, median)

print("Zero values after replacement:")

for column in columns:
    print(f"{column}: {(data[column] == 0).sum()}")

print("\nFirst 5 rows after preprocessing:")
print(data.head())
# .................................Feature Engineering
# .................................     BMI Category      -------------------------------

data['BMI_Category'] = pd.cut(
    data['BMI'],
    bins=[0, 18.5, 25, 30, 100],
    labels=['Underweight', 'Normal', 'Overweight', 'Obese']
)
# -------------------------------      Age Group    -------------------------------

data['Age_Group'] = pd.cut(
    data['Age'],
    bins=[20, 30, 40, 50, 100],
    labels=['21-30', '31-40', '41-50', '51+']
)

#.............................convert CATEGORIES TO NUMBER ..........................

data['BMI_Category'] = data['BMI_Category'].cat.codes
data['Age_Group'] = data['Age_Group'].cat.codes

# -------------------------------Feature Engineering Results-------------------------------

print("\n===== FEATURE ENGINEERING RESULTS =====")

print(
    data[
        [
            'Glucose',
            'BMI',
            'BMI_Category',
            'Age',
            'Age_Group',
        ]
    ].head()
)


# ................................. TRAIN TEST SPLIT ........................


# Features (Input)
X = data.drop("Outcome", axis=1)

# Target (Output)
y = data["Outcome"]

# Split data into training (80%) and testing (20%)
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining Data Shape:", X_train.shape)
print("Testing Data Shape:", X_test.shape)

print("\nTraining Class Distribution:")
print(y_train.value_counts())

print("\nTesting Class Distribution:")
print(y_test.value_counts())

#...........................RANDOM FOREST MODEL CREATION...............

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train the model
model.fit(X_train, y_train)

# Predict on test data
y_pred = model.predict(X_test)

#.............. Calculate accuracy, precision , recall and f1 score ..................
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n===== MODEL EVALUATION =====")
print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# -------------------------------
#............................. Stratified 5-Fold Cross Validation.....................

# Create 5-fold stratified cross validation
cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision',
    'recall': 'recall',
    'f1': 'f1'
}

cv_results = cross_validate(
    model,
    X,
    y,
    cv=cv,
    scoring=scoring
)

print("\n===== CROSS VALIDATION RESULTS =====")
print(f"Average Accuracy : {cv_results['test_accuracy'].mean():.4f}")
print(f"Average Precision: {cv_results['test_precision'].mean():.4f}")
print(f"Average Recall   : {cv_results['test_recall'].mean():.4f}")
print(f"Average F1 Score : {cv_results['test_f1'].mean():.4f}")

#...........................HYPERPARAMETER TUNING.................................

param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [5, 10, None],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2],
   'class_weight': [
    'balanced',
    {0: 1, 1: 2},
    {0: 1, 1: 3},
    {0: 1, 1: 4},
    {0: 1, 1: 5},
    {0: 1, 1: 6}
]
}
#..............................GRIDSEARCH CV CREATED ......................
grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=5,
    scoring='f1',
    n_jobs=-1
)
#..............................TRAINING THE GRIDSEARCH.........................
print("\nRunning Hyperparameter Tuning...")
grid_search.fit(X_train, y_train)

#............................PRINT BEST PARAMETERS ..........................
print("\n===== BEST PARAMETERS =====")
print(grid_search.best_params_)

print("\nBest Cross Validation F1 Score:")
print(grid_search.best_score_)

#......................................EVALUATE BEST MODEL ..................
best_model = grid_search.best_estimator_

y_pred_best = best_model.predict(X_test)

print("\n===== TUNED MODEL RESULTS =====")

print("Accuracy :", accuracy_score(y_test, y_pred_best))
print("Precision:", precision_score(y_test, y_pred_best))
print("Recall   :", recall_score(y_test, y_pred_best))
print("F1 Score :", f1_score(y_test, y_pred_best))

# ============================     FEATURE IMPORTANCE ============================

feature_importance = pd.DataFrame({
    'Feature': X.columns,
    'Importance': best_model.feature_importances_
})

feature_importance = feature_importance.sort_values(
    by='Importance',
    ascending=False
)

print("\n===== FEATURE IMPORTANCE =====")
print(feature_importance)
# ========================== SAVE TRAINED MODEL==========================
joblib.dump(best_model, "model.pkl")
joblib.dump(list(X.columns), "features.pkl")

print("\n✅ Model saved successfully as model.pkl")
print("✅ Feature names saved as features.pkl")