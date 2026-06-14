from server import app
import players
import draws
import results
import matches
import old_matches

if __name__ == "__main__":
    # Optional: print to verify routes are loaded
    print(app.url_map)
    app.run(debug=True, host="127.0.0.1", port=5001)