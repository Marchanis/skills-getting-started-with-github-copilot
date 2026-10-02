document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  function updateActivityCard(activityCard) {
    const participantsList = activityCard.querySelector(".participants-list");
    const participantCount = participantsList.querySelectorAll(".participant-item").length;
    const emptyItem = participantsList.querySelector(".participants-empty");

    if (participantCount === 0 && !emptyItem) {
      const item = document.createElement("li");
      item.className = "participants-empty";
      item.textContent = "No participants yet";
      participantsList.appendChild(item);
    } else if (participantCount > 0) {
      emptyItem?.remove();
    }

    activityCard.querySelector(".participants-heading").textContent =
      `Participants (${participantCount})`;
    const availableSpots = Number(activityCard.dataset.maxParticipants) - participantCount;
    activityCard.querySelector(".activity-availability span").textContent =
      `${availableSpots} spots left`;
  }

  function createParticipantItem(activityName, email, activityCard) {
    const participantItem = document.createElement("li");
    participantItem.className = "participant-item";

    const participantEmail = document.createElement("span");
    participantEmail.className = "participant-email";
    participantEmail.textContent = email;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "participant-remove";
    removeButton.setAttribute("aria-label", `Remove ${email} from ${activityName}`);
    removeButton.title = "Unregister participant";

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v5", "M14 11v5"].forEach(
      (pathData) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        icon.appendChild(path);
      }
    );
    removeButton.appendChild(icon);

    removeButton.addEventListener("click", async () => {
      removeButton.disabled = true;
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (!response.ok) {
          showMessage(result.detail || "Unable to unregister participant", "error");
          return;
        }

        participantItem.remove();
        updateActivityCard(activityCard);
        showMessage(result.message, "success");
      } catch (error) {
        showMessage("Failed to unregister participant. Please try again.", "error");
        console.error("Error unregistering participant:", error);
      } finally {
        removeButton.disabled = false;
      }
    });

    participantItem.append(participantEmail, removeButton);
    return participantItem;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;
        activityCard.dataset.maxParticipants = details.max_participants;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span>${spotsLeft} spots left</span></p>
        `;

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = `Participants (${details.participants.length})`;

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        details.participants.forEach((email) => {
          participantsList.appendChild(createParticipantItem(name, email, activityCard));
        });

        activityCard.append(participantsHeading, participantsList);
        updateActivityCard(activityCard);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
