import { useState } from "react";
import { supabase } from "../lib/supabase";
import { safeQuery } from "../lib/supabaseHelper";

export default function CheckInTest() {
  const [checkIns, setCheckIns] = useState([]);
  const [message, setMessage] = useState("");

  const handleFetchCheckIns = async () => {
    const result = await safeQuery(
      supabase.from("check_ins").select("*"),
      "fetching check-ins"
    );
    if (result.error) {
      alert(result.error.message);
    } else {
      setCheckIns(result.data || []);
    }
  };

  const handleAddCheckIn = async () => {
    const result = await safeQuery(
      supabase.from("check_ins").insert({
        full_name: "Funie Zhuwao",
        check_in_time: new Date().toISOString(),
      }),
      "adding check-in"
    );
    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
    } else {
      setMessage("Check-in added successfully");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Check-In Test Page</h1>

        <div className="space-y-4">
          <button
            onClick={handleFetchCheckIns}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-[7px] font-medium hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Fetch Check-Ins
          </button>

          <button
            onClick={handleAddCheckIn}
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-[7px] font-medium hover:bg-secondary/90 transition-colors duration-200 shadow-lg hover:shadow-xl ml-4"
          >
            Add Check-In
          </button>
        </div>

        {message && (
          <p className="text-lg text-foreground">{message}</p>
        )}

        {checkIns.length > 0 && (
          <table className="mx-auto border-collapse border border-primary">
            <thead>
              <tr>
                <th className="border border-primary px-4 py-2">Full Name</th>
                <th className="border border-primary px-4 py-2">Check In Time</th>
                <th className="border border-primary px-4 py-2">Check Out Time</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((checkIn, index) => (
                <tr key={index}>
                  <td className="border border-primary px-4 py-2">
                    {checkIn.full_name}
                  </td>
                  <td className="border border-primary px-4 py-2">
                    {checkIn.check_in_time}
                  </td>
                  <td className="border border-primary px-4 py-2">
                    {checkIn.check_out_time || 'Not checked out'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}