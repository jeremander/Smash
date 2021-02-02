
$(document).ready(function () {

  // enable tooltips globally
  $(function() {
    $('[data-toggle="tooltip"]').tooltip()
  });

  // lay out game data
  setupGame();

  // "Random" button pressed
  $("#random-button").click(function() {
    roster.randomPressed();
  });

  // "No Repeat" checkbox changed
  $("#no-repeat-check").change(function() {
    roster.setNoRepeats(this.checked);
  });

  // roster distribution changed
  $("#roster-menu select").change(function(e) {
    // cache the distribution
    let dist = $(this).children("option:selected").val();
    let game = getCurrentGame();
    localStorage.setItem(game + "-roster-dist", dist);
    // reload the roster with the chosen distribution
    loadCharacters(true);
  });

  // refresh button pressed
  $("#refresh-roster").click(function() {
    // reset the roster with the current distribution
    loadCharacters(true)
  });

  setupGameSelectionModal();

});