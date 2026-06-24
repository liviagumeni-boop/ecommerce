import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-dark text-light mt-5">
      <div className="container py-5">

        <div className="row g-4">

          {}
          <div className="col-md-6">
            <h5 className="mb-3">Contacts</h5>

            <div className="d-flex align-items-center mb-2">
              <FaPhone className="me-2" />
              <span>0683336383</span>
            </div>

            <div className="d-flex align-items-center mb-2">
              <FaEnvelope className="me-2" />
              <span>liviagumeni@gmail.com</span>
            </div>

            <div className="d-flex align-items-center">
              <FaMapMarkerAlt className="me-2" />
              <span>Rruga e Kavajes, Square 21</span>
            </div>
          </div>

          {}
          <div className="col-md-6">
            <h5 className="mb-3">Our Location</h5>

            <div className="rounded overflow-hidden">
              <iframe
                title="google-map"
                src="https://www.google.com/maps/place/Idealdevs/data=!4m2!3m1!1s0x0:0xd9e3eff953c3e7f7?sa=X&ved=1t:2428&ictx=111"
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
              ></iframe>
            </div>
          </div>

        </div>
      </div>

      {}
      <div className="bg-black text-center py-3">
        <small>© 2026 Ecommerce. Të gjitha të drejtat e rezervuara.</small>
      </div>
    </footer>
  );
}

export default Footer;