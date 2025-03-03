# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Run the server
python run.py


# Install dependencies
cd frontend
npm install

# Start development server
npm start