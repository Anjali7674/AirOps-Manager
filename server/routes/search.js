const express = require('express');
const db = require('../db/pool');
const { verifyCustomer } = require('../middleware/auth');
const { validateBookTicket } = require('../middleware/validate');

const router = express.Router();

// Store flight search criteria scoped to the authenticated customer
router.post('/BookTicket', verifyCustomer, validateBookTicket, (req, res) => {
  const {
    departure,
    arrival,
    departureDate,
    returnDate,
    class: flightClass,
    price
  } = req.body;

  const clientId = req.user.client_id;

  db.query(
    `INSERT INTO FlightBooking
      (client_id, departure, arrival, departureDate, returnDate, class, price)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      clientId,
      departure,
      arrival,
      departureDate,
      returnDate,
      flightClass,
      price
    ],
    (err) => {
      if (err) {
        console.error('Could not save search:', err);
        return res.status(500).json({
          message: 'Could not save search',
          error: err.message
        });
      }

      res.status(201).json({ success: true });
    }
  );
});

router.get('/SearchFlights', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  db.query(
    `SELECT
       fb_id,
       departure,
       arrival,
       departureDate,
       returnDate,
       class,
       price
     FROM FlightBooking
     WHERE client_id = ?
     ORDER BY fb_id DESC
     LIMIT 1`,
    [clientId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      res.json(results);
    }
  );
});

router.post('/AvailableFlights', verifyCustomer, (req, res) => {
  const { departureDate, returnDate, fares } = req.body;

  if (!departureDate || !returnDate || fares === undefined) {
    return res.status(400).json({
      message: 'departureDate, returnDate and fares are required'
    });
  }

  const faresInt = parseInt(fares, 10);

  if (isNaN(faresInt)) {
    return res.status(400).json({
      message: 'fares must be a number'
    });
  }

  db.query(
    `SELECT
        f.flight_no,
        s.schedule_id,
        f.airplane_id,
        a.max_seats,
        s.departure_time,
        s.arrival_time,
        fs.status,
        f.fares
     FROM Flight f
     INNER JOIN schedule s
       ON s.schedule_id = f.schedule_id
     INNER JOIN FlightStatus fs
       ON fs.flightStatus_id = f.flightStatus_id
     INNER JOIN airplane a
       ON a.airplane_id = f.airplane_id
     WHERE DATE(STR_TO_DATE(s.departure_time, '%e-%b-%Y %H:%i:%s')) = ?
       AND DATE(STR_TO_DATE(s.arrival_time, '%e-%b-%Y %H:%i:%s')) = ?
       AND (? = 0 OR f.fares <= ?)`,
    [departureDate, returnDate, faresInt, faresInt],
    (err, results) => {
      if (err) {
        console.error('AvailableFlights error:', err);

        return res.status(500).json({
          message: 'Server error',
          error: err.message
        });
      }

      console.log('Available flights:', results);
      res.json(results);
    }
  );
});

// ===============================
// SEAT MAP
// ===============================
// Returns all seats from tempseatgen
// and marks booked seats for selected flight.
router.get('/seatmap/:flight_no', verifyCustomer, (req, res) => {
  const flightNo = parseInt(req.params.flight_no, 10);

  if (isNaN(flightNo)) {
    return res.status(400).json({
      message: 'Invalid flight number'
    });
  }

  db.query(
    `SELECT
       t.nm AS seat_no,
       CASE
         WHEN EXISTS (
           SELECT 1
           FROM ticket tk
           WHERE tk.flight_no = ?
             AND tk.seat_no = t.nm
         )
         THEN 1
         ELSE 0
       END AS booked
     FROM tempseatgen t
     ORDER BY t.gen_id`,
    [flightNo],
    (err, results) => {
      if (err) {
        console.error('Seat map error:', err);

        return res.status(500).json({
          message: 'Could not load seat map',
          error: err.message
        });
      }

      res.json(results);
    }
  );
});

// Remove temporary search
router.delete('/removeSearch', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  db.query(
    'DELETE FROM FlightBooking WHERE client_id = ? AND flight_no IS NULL',
    [clientId],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: 'Could not clear search'
        });
      }

      res.json({ success: true });
    }
  );
});

router.post('/UpdateFlightBooking', verifyCustomer, (req, res) => {
  const { id } = req.body;
  const clientId = req.user.client_id;

  if (!id) {
    return res.status(400).json({
      message: 'id is required'
    });
  }

  db.query(
    `UPDATE FlightBooking
     SET flight_no = (
       SELECT f.flight_no
       FROM Flight f
       INNER JOIN schedule s
         ON s.schedule_id = f.schedule_id
       WHERE s.schedule_id = ?
       LIMIT 1
     )
     WHERE client_id = ?
       AND flight_no IS NULL`,
    [id, clientId],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: 'Server error'
        });
      }

      res.json({ success: true });
    }
  );
});

router.get('/invoice/:id', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  if (String(clientId) !== String(req.params.id)) {
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  db.query(
    'SELECT fname, lname FROM clients WHERE client_id = ?',
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: 'Server error'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: 'Client not found'
        });
      }

      res.json(results[0]);
    }
  );
});

router.get('/invoicefares', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  db.query(
    `SELECT
       flight_no,
       departure,
       price
     FROM FlightBooking
     WHERE client_id = ?
     ORDER BY fb_id DESC
     LIMIT 1`,
    [clientId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: 'Server error'
        });
      }

      res.json(results[0] || {});
    }
  );
});

// ===============================
// CONFIRM BOOKING WITH SELECTED SEAT
// ===============================
router.post('/invoiceconfirm', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  const {
    id,
    departure,
    flight_no,
    fares,
    seat_no
  } = req.body;

  if (
    !id ||
    !departure ||
    !flight_no ||
    fares === undefined ||
    !seat_no
  ) {
    return res.status(400).json({
      message: 'id, departure, flight_no, fares and seat_no are required'
    });
  }

  const flightNo = parseInt(flight_no, 10);
  const scheduleId = parseInt(id, 10);
  const fareAmount = parseInt(fares, 10);

  if (
    isNaN(flightNo) ||
    isNaN(scheduleId) ||
    isNaN(fareAmount)
  ) {
    return res.status(400).json({
      message: 'Invalid booking information'
    });
  }

  // First make sure selected seat actually exists
  db.query(
    'SELECT nm FROM tempseatgen WHERE nm = ? LIMIT 1',
    [seat_no],
    (seatErr, seatRows) => {
      if (seatErr) {
        console.error('Seat validation error:', seatErr);

        return res.status(500).json({
          message: 'Could not validate seat',
          error: seatErr.message
        });
      }

      if (seatRows.length === 0) {
        return res.status(400).json({
          message: 'Invalid seat selected'
        });
      }

      // Create ticket using the selected seat
      db.query(
        `INSERT INTO ticket
          (seat_no, flight_no, departure_time, gate_no, airport_code)
         SELECT
           ?,
           ?,
           s.departure_time,
           a.gate_no,
           a.airport_code
         FROM Flight f
         INNER JOIN schedule s
           ON s.schedule_id = f.schedule_id
         INNER JOIN airport a
           ON a.airport_name = ?
         WHERE s.schedule_id = ?
           AND f.flight_no = ?
         LIMIT 1`,
        [
          seat_no,
          flightNo,
          departure,
          scheduleId,
          flightNo
        ],
        (ticketErr, ticketResult) => {
          if (ticketErr) {
            console.error('Ticket insert ERROR:', ticketErr);

            // Duplicate flight + seat
            if (ticketErr.code === 'ER_DUP_ENTRY') {
              return res.status(409).json({
                message: `Seat ${seat_no} has already been booked. Please select another seat.`
              });
            }

            return res.status(500).json({
              message: 'Could not create ticket',
              error: ticketErr.message
            });
          }

          if (ticketResult.affectedRows === 0) {
            return res.status(400).json({
              message: 'Flight, schedule or departure airport could not be matched'
            });
          }

          const ticketId = ticketResult.insertId;

          // Create actual booking
          db.query(
            `INSERT INTO booking
              (client_id, airport_code, ticket_id, flight_no, fares)
             SELECT
               ?,
               airport_code,
               ?,
               ?,
               ?
             FROM ticket
             WHERE ticket_id = ?`,
            [
              clientId,
              ticketId,
              flightNo,
              fareAmount,
              ticketId
            ],
            (bookingErr) => {
              if (bookingErr) {
                console.error('Booking insert ERROR:', bookingErr);

                // Remove ticket if booking creation failed
                db.query(
                  'DELETE FROM ticket WHERE ticket_id = ?',
                  [ticketId],
                  () => {}
                );

                return res.status(500).json({
                  message: 'Could not create booking',
                  error: bookingErr.message
                });
              }

              res.json({
                success: true,
                ticketId: ticketId,
                seat_no: seat_no,
                flight_no: flightNo,
                bookingCreated: true
              });
            }
          );
        }
      );
    }
  );
});

router.get('/profile/:id', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  if (String(clientId) !== String(req.params.id)) {
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  db.query(
    `SELECT
       client_id,
       fname,
       mname,
       lname,
       phone,
       email,
       passport
     FROM clients
     WHERE client_id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: 'Server error'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: 'Client not found'
        });
      }

      res.json(results[0]);
    }
  );
});

router.get('/CustomerPanel/:id', verifyCustomer, (req, res) => {
  const clientId = req.user.client_id;

  if (String(clientId) !== String(req.params.id)) {
    return res.status(403).json({
      message: 'Forbidden'
    });
  }

  db.query(
    'SELECT fname FROM clients WHERE client_id = ?',
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: 'Server error'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: 'Client not found'
        });
      }

      res.json(results[0]);
    }
  );
});

module.exports = router;