from server import app
import atp_scrapers
import wta_scrapers

if __name__ == "__main__":
    # Optional: print to verify routes are loaded
    print(app.url_map)
    app.run(debug=True, host="127.0.0.1", port=5001)