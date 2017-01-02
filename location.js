var d;
var today = new Date();
var year = today.getFullYear();
var activeYear = year;        // the year currently being shown
var month = today.getMonth() + 1;
var day = today.getDate();
var locPost;   // the location as sent throught the submit button

$(document).ready(function() {
     $('#location-form').submit(function() {
          locPost = $('#location').val();
          if (locPost != "") {
               $("#error").hide();
               yearPost = $('#year').html();
               activeYear = yearPost;
               $.ajax({
                    url: "content.html",
                    success: function(data) {
                         $("#loading").fadeIn('fast');
                         $("#content-area").html(data);
                         bindEvents();
                         retrieveTimes(locPost, yearPost);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                         $("#error").html("<strong>Something bad happened.</strong> You can try again, maybe refresh the page?");
                         $("#error:hidden").fadeIn();
                    }
               });
          } else {
               $("#error").html("<strong>Oops!</strong> You need to provide a location.");
               $("#error:hidden").fadeIn();
          }
          return false;
     });
     
     $('#year-add').click(function () {
          var currentVal = $('#year').html();
          if (currentVal < 3000) {
               $('#year').html(Number(currentVal)+1);
          }
          return false;     
     });
     
     $('#year-subtract').click(function () {
          var currentVal = $('#year').html();
          if (currentVal > 0) {
               $('#year').html(Number(currentVal)-1);
          }
          return false;     
     });
     
     $('#location-help').hover(function () {
          $("#location-tooltip").fadeIn();
     }, function () {
          $("#location-tooltip").fadeOut();
     });
});

function retrieveTimes(loc, yr) {
     var sendData = "year=" +yr+ "&location=" +loc;
     $.ajax({
          type: "POST",
          url: "display.php",
          dataType: "json",
          data: sendData,
          success: function(data) {
               d = data;
               $("#loading").fadeOut('fast');
               if (d.location.error != "0") {
                    $("#error").html("<strong>Oops.</strong> Your location doesn't seem to be valid. Try again. ");
                    $("#error:hidden").fadeIn();
               } else if (d.location.quality < 20 || d.location.tz == "" || d.location.tz == null) {
                    $("#error").html("<strong>Oops.</strong> Your location seems to be too vague. Try to be more specific.");
                    $("#error:hidden").fadeIn();
               } else {
                    $("#popup-wrapper").fadeOut();
                    init();
                    display();
               }
          },
          error: function(jqXHR, textStatus, errorThrown) {
               $("#error").html("<strong>Something bad happened.</strong> You can try again, maybe refresh the page?");
               $("#error:hidden").fadeIn();
          }
     });
}