const BASE_URL = process.env.BASE_URL || "http://localhost:3000";


async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${path}`, options);
  return response.json();
}

// main test function

async function runConcurrencyTest() {
  console.log("=".repeat(60));
  console.log("CONCURRENCY TEST: Ticket Booking System");
  console.log("=".repeat(60));
  console.log();

  const SECTION_CAPACITY = 5;
  const PARALLEL_REQUESTS = 10;
  const SEATS_PER_BOOKING = 1;

  try {
    //create a test event
    console.log(`[1] Creating test event with ${SECTION_CAPACITY} seats...`);
    const createEventResponse = await request("POST", "/events/create", {
      name: `Concurrency Test Event - ${Date.now()}`,
      sections: [
        {
          name: "Test Section",
          price: 100,
          capacity: SECTION_CAPACITY,
        },
      ],
    });

    if (!createEventResponse.success) {
      throw new Error(`Failed to create event: ${createEventResponse.message}`);
    }

    const eventId = createEventResponse.data._id;
    const sectionId = createEventResponse.data.sections[0]._id;
    console.log(`    Event created: ${eventId}`);
    console.log(`    Section ID: ${sectionId}`);
    console.log(`    Initial remaining seats: ${SECTION_CAPACITY}`);
    console.log();

    // send parallel booking requests
    console.log(
      `[2] Sending ${PARALLEL_REQUESTS} PARALLEL booking requests...`
    );
    console.log(`    (Each requesting ${SEATS_PER_BOOKING} seat)`);
    console.log();

    const startTime = Date.now();

    //create array of promises for parallel execution
    const bookingPromises = Array.from({ length: PARALLEL_REQUESTS }, (_, i) =>
      request("POST", "/book", {
        eventId,
        sectionId,
        qty: SEATS_PER_BOOKING,
      }).then((response) => ({
        requestNumber: i + 1,
        ...response,
      }))
    );

    //execute ALL requests in parallel
    const results = await Promise.all(bookingPromises);

    const elapsedTime = Date.now() - startTime;

    //analyze results
    console.log(`[3] Results (completed in ${elapsedTime}ms):`);
    console.log("-".repeat(60));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`    Successful bookings: ${successful.length}`);
    console.log(`    Failed bookings: ${failed.length}`);
    console.log();

    //log individual results
    console.log("    Individual Results:");
    results.forEach((r) => {
      const status = r.success ? "✓ SUCCESS" : "✗ FAILED";
      const detail = r.success
        ? `Remaining: ${r.data.remainingSeats}`
        : r.message;
      console.log(`      Request #${r.requestNumber}: ${status} - ${detail}`);
    });
    console.log();

    //verify final state
    console.log("[4] Verifying final state...");
    const eventResponse = await request("GET", `/events/${eventId}`);

    if (!eventResponse.success) {
      throw new Error(`Failed to fetch event: ${eventResponse.message}`);
    }

    const finalRemaining = eventResponse.data.sections[0].remaining;
    const totalBooked = successful.length * SEATS_PER_BOOKING;

    console.log(`    Section capacity: ${SECTION_CAPACITY}`);
    console.log(`    Final remaining: ${finalRemaining}`);
    console.log(`    Total booked: ${totalBooked}`);
    console.log();

    //validate results
    console.log("[5] Validation:");
    console.log("-".repeat(60));

    let allTestsPassed = true;

    //correct number of successful bookings
    const expectedSuccessful = SECTION_CAPACITY / SEATS_PER_BOOKING;
    if (successful.length === expectedSuccessful) {
      console.log(
        `Successful bookings: ${successful.length} (expected: ${expectedSuccessful})`
      );
    } else {
      console.log(
        `Successful bookings: ${successful.length} (expected: ${expectedSuccessful})`
      );
      allTestsPassed = false;
    }

    //remaining seats should be exactly 0
    if (finalRemaining === 0) {
      console.log(`Remaining seats: ${finalRemaining} (expected: 0)`);
    } else {
      console.log(`Remaining seats: ${finalRemaining} (expected: 0)`);
      allTestsPassed = false;
    }

    //remaining should never be negative
    if (finalRemaining >= 0) {
      console.log(`Remaining >= 0: PASSED (no overselling)`);
    } else {
      console.log(`Remaining >= 0: FAILED (OVERSELLING DETECTED!)`);
      allTestsPassed = false;
    }

    //total booked should equal capacity
    if (totalBooked === SECTION_CAPACITY) {
      console.log(
        `Total booked (${totalBooked}) = Capacity (${SECTION_CAPACITY})`
      );
    } else {
      console.log(
        `    ✗ Total booked (${totalBooked}) ≠ Capacity (${SECTION_CAPACITY})`
      );
      allTestsPassed = false;
    }

    console.log();
    console.log("=".repeat(60));
    if (allTestsPassed) {
      console.log("ALL CONCURRENCY TESTS PASSED!");
      console.log("The booking system correctly handles race conditions.");
    } else {
      console.log("SOME TESTS FAILED!");
      console.log("There may be a concurrency issue in the booking system.");
    }
    console.log("=".repeat(60));

    process.exit(allTestsPassed ? 0 : 1);
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error();
    console.error("Make sure the server is running: npm start");
    process.exit(1);
  }
}

//test run
runConcurrencyTest();
