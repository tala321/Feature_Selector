# Feature_Selector

A feature selection project using Genetic Algorithm to optimize model performance by reducing the number of input features without compromising accuracy.

---

##  Project Overview

- Applies a Genetic Algorithm to select the most relevant features from CSV datasets
- Supports file uploads from local device or external URLs
- Displays detailed results including selected features, selection ratio, generation count, execution time, and accuracy
- Includes a comparison page between traditional methods and genetic selection
- Stores results in a SQLite database

---

##  Technologies Used

- Python & Django
- Bootstrap 5
- Pandas & Scikit-learn
- HTML Templates
- GitHub for collaboration and version control

---

##  Features

### Data Upload
- Upload CSV files from device or external link

### Genetic Algorithm Execution
- Automatically selects the target column as the last column in the dataset
- (Optional) Manual target column selection can be added later

### Results Display
- Genetic results preview page with full details
- Traditional methods preview page
- Comparison page between both approaches

---

##  React Frontend (Optional)

If you're using a React frontend, these scripts apply:

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production in the `build` folder

### `npm run eject`
Removes Create React App configuration (irreversible)

---

## 📖 Usage Guide

- The target column is automatically selected as the last column
- The algorithm handles each data type independently
- Textual data is not fully supported yet (under development)
- Selected features that do not affect prediction accuracy are clearly displayed

---

##  Instructor Requirements (Implemented or Pending)

-  Support for uploading from external URLs
-  Documentation of target column selection method
-  Clarification that each data type is handled independently
-  Organized Git usage (commits, PRs, reviews, merges)
-  API endpoints 
-  Full documentation 
---

##  Project Structure
Feature_Selector/ ├── core/ │   ├── models.py │   ├── views.py │   ├── genetic_selector.py │   ├── templates/ │   └── migrations/ ├── datasets/ ├── feature_selector/ │   └── settings.py ├── manage.py └── README.md

