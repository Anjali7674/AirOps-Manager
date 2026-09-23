import React, { useState, useEffect } from 'react';
import {
  useParams,
  useHistory,
  useLocation
} from 'react-router-dom';

import { Plane, CheckCircle, Armchair } from 'lucide-react';
import Swal from 'sweetalert2';
import apiClient from '../../api/client';
import CustomerNavbar from '../CustomerNavbar';

const initialState = {
  sc_id: '',
  cl_id: ''
};

export default function Invoice() {
  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();

  const [data, setData] = useState({});
  const [user, setUser] = useState({});
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState('');
  const [paying, setPaying] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(true);

  const fare = new URLSearchParams(location.search).get('fare');

  useEffect(() => {
    const [sc_id, cl_id] = id.split('-');

    initialState.sc_id = sc_id;
    initialState.cl_id = cl_id;

    const load = async () => {
      await apiClient.post('/UpdateFlightBooking', {
        id: initialState.sc_id
      });

      const [clientRes, faresRes] = await Promise.all([
        apiClient.get(`/invoice/${initialState.cl_id}`),
        apiClient.get('/invoicefares')
      ]);

      setData(clientRes.data || {});
      setUser(faresRes.data || {});

      // Load seats for selected flight
      if (faresRes.data && faresRes.data.flight_no) {
        try {
          const seatRes = await apiClient.get(
            `/seatmap/${faresRes.data.flight_no}`
          );

          setSeats(seatRes.data || []);
        } catch (seatError) {
          console.error('Seat map error:', seatError);

          Swal.fire(
            'Error',
            'Could not load the seat map.',
            'error'
          );
        }
      }

      setLoadingSeats(false);
    };

    load().catch((error) => {
      console.error('Invoice load error:', error);

      setLoadingSeats(false);

      Swal.fire(
        'Error',
        'Could not load your booking details. Please try again.',
        'error'
      );
    });
  }, [id]);

  const handleSeatSelect = (seat) => {
    if (Number(seat.booked) === 1) {
      return;
    }

    setSelectedSeat(seat.seat_no);
  };

  const handlePay = async () => {
    if (!selectedSeat) {
      Swal.fire(
        'Select Seat',
        'Please select a seat before confirming your booking.',
        'warning'
      );

      return;
    }

    setPaying(true);

    try {
      await apiClient.post('/invoiceconfirm', {
        id: initialState.sc_id,
        departure: user.departure,
        flight_no: user.flight_no,
        fares: fare ? parseInt(fare, 10) : 0,
        seat_no: selectedSeat
      });

      await apiClient.delete('/removeSearch');

      await Swal.fire({
        title: 'Ticket Booked!',
        text: `Seat ${selectedSeat} has been confirmed.`,
        icon: 'success',
        confirmButtonColor: '#0EA5E9'
      });

      history.push(
        `/boarding-pass/${initialState.cl_id}`
      );
    } catch (error) {
      console.error('Payment error:', error);

      const message =
        error?.response?.data?.message ||
        'Could not complete booking. Please try again.';

      Swal.fire(
        'Booking Error',
        message,
        'error'
      );

      // Reload seat map in case another user booked the seat
      if (user.flight_no) {
        try {
          const seatRes = await apiClient.get(
            `/seatmap/${user.flight_no}`
          );

          setSeats(seatRes.data || []);

          const updatedSeat = (seatRes.data || []).find(
            (seat) => seat.seat_no === selectedSeat
          );

          if (updatedSeat && Number(updatedSeat.booked) === 1) {
            setSelectedSeat('');
          }
        } catch (reloadError) {
          console.error('Could not reload seats:', reloadError);
        }
      }

      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />

      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Summary
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Review your flight details and select your seat
          </p>
        </div>

        {/* Flight card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">

          <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Plane
                  size={18}
                  className="text-white"
                />
              </div>

              <div>
                <p className="text-sky-100 text-xs">
                  AirOps Manager
                </p>

                <p className="text-white font-bold">
                  Flight {user.flight_no || '—'}
                </p>
              </div>

            </div>
          </div>

          {/* Passenger */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Passenger
            </p>

            <p className="font-semibold text-gray-900">
              {data.fname || '—'} {data.lname || ''}
            </p>
          </div>

          {/* Flight info */}
          <div className="px-6 py-4 border-b border-gray-100">

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Departure
                </p>

                <p className="text-sm font-semibold text-gray-800">
                  {user.departure || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Fare
                </p>

                <p className="text-sm font-semibold text-gray-800">
                  {fare ? `$ ${fare}` : '—'}
                </p>
              </div>

            </div>

          </div>

          {/* Amount */}
          <div className="px-6 py-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Total Amount Due
                </p>

                <p className="text-3xl font-black text-gray-900">
                  {fare ? `$ ${fare}` : '—'}
                </p>
              </div>

              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle
                  size={24}
                  className="text-green-500"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Seat Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Select Your Seat
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Choose an available seat
              </p>
            </div>

            <Armchair
              size={28}
              className="text-sky-500"
            />

          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-600">

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
              Available
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-sky-500" />
              Selected
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500" />
              Booked
            </div>

          </div>

          {loadingSeats ? (

            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            </div>

          ) : seats.length === 0 ? (

            <div className="text-center py-8 text-gray-500">
              No seats available for this flight.
            </div>

          ) : (

            <div>

              {/* Aircraft front */}
              <div className="text-center mb-6">
                <div className="inline-block px-5 py-2 bg-slate-100 rounded-full text-xs font-semibold text-gray-500">
                  FRONT OF AIRCRAFT ✈️
                </div>
              </div>

              {/* Seat grid */}
              <div className="max-w-md mx-auto">

                <div className="grid grid-cols-3 gap-3">

                  {seats.map((seat) => {

                    const isBooked = Number(seat.booked) === 1;
                    const isSelected =
                      selectedSeat === seat.seat_no;

                    let seatClass =
                      'bg-gray-100 border-gray-300 text-gray-700 hover:bg-slate-200';

                    if (isBooked) {
                      seatClass =
                        'bg-red-500 border-red-500 text-white cursor-not-allowed';
                    } else if (isSelected) {
                      seatClass =
                        'bg-sky-500 border-sky-500 text-white ring-4 ring-sky-100';
                    }

                    return (
                      <button
                        key={seat.seat_no}
                        type="button"
                        disabled={isBooked || paying}
                        onClick={() => handleSeatSelect(seat)}
                        className={`
                          h-16
                          rounded-xl
                          border-2
                          font-bold
                          text-sm
                          transition-all
                          flex
                          flex-col
                          items-center
                          justify-center
                          ${seatClass}
                        `}
                      >

                        <Armchair size={18} />

                        <span className="mt-1">
                          {seat.seat_no}
                        </span>

                      </button>
                    );
                  })}

                </div>

              </div>

            </div>

          )}

          {/* Selected seat */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-center">

            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Selected Seat
            </p>

            <p className="text-xl font-black text-gray-900 mt-1">
              {selectedSeat || 'Please select a seat'}
            </p>

          </div>

        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-6">

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Includes
          </p>

          {[
            'Seat reservation',
            'Carry-on baggage',
            'In-flight service'
          ].map((service) => (

            <div
              key={service}
              className="flex items-center gap-2 py-1.5 text-sm text-gray-600"
            >

              <CheckCircle
                size={14}
                className="text-green-500 flex-shrink-0"
              />

              {service}

            </div>

          ))}

        </div>

        {/* Confirm & Pay */}
        <button
          onClick={handlePay}
          disabled={paying || !selectedSeat || loadingSeats}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
        >

          {paying ? (

            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </>

          ) : (

            <>
              <CheckCircle size={18} />
              Confirm & Pay {fare ? `$ ${fare}` : ''}
            </>

          )}

        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Secure payment · No hidden fees
        </p>

      </div>
    </div>
  );
}