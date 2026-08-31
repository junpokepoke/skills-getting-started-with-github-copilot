document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  async function updateMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantItems = details.participants && details.participants.length
          ? details.participants
          : ["No participants yet"];

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul>
              ${participantItems
                .map((participant) => {
                  if (participant === "No participants yet") {
                    return `<li class="participant-empty">${participant}</li>`;
                  }

                  return `
                    <li class="participant-tag">
                      <span class="participant-email">${participant}</span>
                      <button
                        type="button"
                        class="delete-participant-btn"
                        data-activity="${name}"
                        data-email="${participant}"
                        aria-label="Remove ${participant} from ${name}"
                      >
                        ×
                      </button>
                    </li>
                  `;
                })
                .join("")}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      activitiesList.querySelectorAll(".delete-participant-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const { activity, email } = button.dataset;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );

            const result = await response.json();

            if (response.ok) {
              updateMessage(result.message, "success");
              fetchActivities();
            } else {
              updateMessage(result.detail || "Unable to remove participant.", "error");
            }
          } catch (error) {
            updateMessage("Failed to remove participant.", "error");
            console.error("Error removing participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        updateMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        updateMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      updateMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
