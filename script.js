// Reset all input and output fields
function reset() {
  // Clear allocation, maximum, need, and safe-sequence fields
  for (let p = 1; p <= 5; p++) {
    for (let r = 1; r <= 3; r++) {
      document.getElementById(`a${p}${r}`).value = ''; //allocation
      document.getElementById(`m${p}${r}`).value = ''; //maximume 
      document.getElementById(`n${p}${r}`).value = ''; //need 
    }
    document.getElementById(`p${p}`).value = '';
  }

  // Clear available and resource totals
  ['av11', 'av12', 'av13', 'resourceA', 'resourceB', 'resourceC'].forEach(id => {
    document.getElementById(id).value = '';
  });

}

// Load the sample data into the form
function example() {
  const allocationSample = [
    [0,1,0], [2,0,0], [3,0,2], [2,1,1], [0,0,2]
  ];

  const maxSample = [
    [7,5,3], [3,2,2], [9,0,2], [2,2,2], [4,3,3]
  ];

  // Fill allocation and max matrices
  for (let p = 1; p <= 5; p++) {
    for (let r = 1; r <= 3; r++) {
      document.getElementById(`a${p}${r}`).value = allocationSample[p-1][r-1];
      document.getElementById(`m${p}${r}`).value = maxSample[p-1][r-1];
    }
  }

  // Set total resources
  document.getElementById('resourceA').value = 10;
  document.getElementById('resourceB').value = 5;
  document.getElementById('resourceC').value = 7;
}

function computeAvailable() {
  //Get total resources from input fields
  let totalA = +document.getElementById('resourceA').value || 0; //+'5' = 5 convert in intiger 
  let totalB = +document.getElementById('resourceB').value || 0;
  let totalC = +document.getElementById('resourceC').value || 0;

  //Calculate total used resources
  let usedA = 0;
  let usedB = 0;
  let usedC = 0;

  for (let p = 1; p <= 5; p++) {
    usedA += +document.getElementById(`a${p}1`).value || 0;
    usedB += +document.getElementById(`a${p}2`).value || 0;
    usedC += +document.getElementById(`a${p}3`).value || 0;
  }

  //Calculate available resources
  let availableA = totalA - usedA;
  let availableB = totalB - usedB;
  let availableC = totalC - usedC;

  //Update the available resource fields
  document.getElementById('av11').value = availableA;
  document.getElementById('av12').value = availableB;
  document.getElementById('av13').value = availableC;
}


// Compute Need = Max - Allocation for each process
function computeNeed() {
  for (let p = 1; p <= 5; p++) {
    for (let r = 1; r <= 3; r++) {
      const maxVal = +document.getElementById(`m${p}${r}`).value || 0;
      const allocVal = +document.getElementById(`a${p}${r}`).value || 0;
      document.getElementById(`n${p}${r}`).value = maxVal - allocVal;
    }
  }
}

// Check safety of current state and display safe sequence if it exists
function runSafetyCheck() {
  computeAvailable();
  computeNeed();

  // Read matrices from the form
  const avail = [
    +document.getElementById('av11').value,
    +document.getElementById('av12').value,
    +document.getElementById('av13').value
  ];

  const alloc = [], need = [];
  for (let p = 1; p <= 5; p++) {
    alloc[p] = [
      +document.getElementById(`a${p}1`).value,
      +document.getElementById(`a${p}2`).value,
      +document.getElementById(`a${p}3`).value
    ];
    need[p] = [
      +document.getElementById(`n${p}1`).value,
      +document.getElementById(`n${p}2`).value,
      +document.getElementById(`n${p}3`).value
    ];
  }

  const finish = Array(5).fill(false);
  const safeSeq = [];
  let work = avail.slice();

  // Try to find a sequence where each process can finish
  for (let count = 0; count < 5; count++) {
    let found = false;

    for (let p = 1; p <= 5; p++) {
      if (!finish[p-1] &&
         need[p][0] <= work[0] &&
         need[p][1] <= work[1] &&
         need[p][2] <= work[2]) {
        // Process p can finish
        work[0] += alloc[p][0];
        work[1] += alloc[p][1];
        work[2] += alloc[p][2];
        finish[p-1] = true;
        safeSeq.push(`P${p}`);
        found = true;
      }
    }

    if (!found) break; // No further processes can finish unsafe
  }

  // Display results
  if (safeSeq.length === 5) {
    for (let i = 0; i < safeSeq.length; i++) {
      document.getElementById(`p${i+1}`).value = safeSeq[i];
    }
    alert("System is in a SAFE state.");    
  } else {
    alert('System is in an UNSAFE (deadlock) state.');
  }
}

// Handle resource request by a specific process
function requestResources() {
  const p = parseInt(prompt('Process ID (1-5)?'));
  const req = [
    +prompt(`Request A for P${p}?`) || 0,
    +prompt(`Request B for P${p}?`) || 0,
    +prompt(`Request C for P${p}?`) || 0
  ];

  // Recompute available and need
  computeAvailable();
  computeNeed();

  const avail = [
    +document.getElementById('av11').value,
    +document.getElementById('av12').value,
    +document.getElementById('av13').value
  ];
  const need = Array(6);
  for (let i = 1; i <= 5; i++) {
    need[i] = [
      +document.getElementById(`n${i}1`).value,
      +document.getElementById(`n${i}2`).value,
      +document.getElementById(`n${i}3`).value
    ];
  }

  // Validate request
  for (let r = 0; r < 3; r++) {
    if (req[r] > need[p][r]) {
      alert('Request exceeds maximum need.');
      return;
    }
    if (req[r] > avail[r]) {
      alert('Not enough resources available; must wait.');
      return;
    }
  }

  // Provisional allocation
  ['av11','av12','av13'].forEach((id, idx) => {
    document.getElementById(id).value = avail[idx] - req[idx];
  });
  for (let r = 1; r <= 3; r++) {
    const elem = document.getElementById(`a${p}${r}`);
    elem.value = +elem.value + req[r-1];
  }

  // Check safety after the provisional allocation
  computeNeed();
  const safe = runSafetyCheck();

  if (safe) {
    alert('Request GRANTED; system remains safe.');
  } else {
    // Roll back original allocation
    ['av11','av12','av13'].forEach((id, idx) => {
      document.getElementById(id).value = avail[idx];
    });
    for (let r = 1; r <= 3; r++) {
      const elem = document.getElementById(`a${p}${r}`);
      elem.value = +elem.value - req[r-1];
    }
    computeNeed();

    alert('Request Not GRANTED; system unsafe.');
  }
}
