define('utils/track/constants',['require'],function(require) {
  var Constants = {
    OFFSET: [
    //1      2      3      4      5      6      7      8      9      10     11     12     13     14     15     16     17     18
      114,   -5,    -12,   -20,   -30,   -60,   -30,   -40,   -40,   -2,    -4,    -80,   0,     -14,   -10,   -130,  -20,   -60,   // wide
      136,   -68,   12,    0,     43,    0,     0,     70,    -32,   110,   0,     -4,    0,     0,     -81,   -101,  41,   -56  // close
    ],

    MOBILE_ARC_CONSTANT: 0.1,
    ARC_CONSTANT: [
      0.5, 0.5, 0.5, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 2, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 2, 0.5, 0.5
    ],

    // whether to change alignment of overlay to left aligned per hole per view
    OVERLAY_ALIGN: [
      false,  false, false, false, false, false, false, false, false, false,  false, false, false, false, false, true, false, false,
      false,  false, false, false, false, false, false, false, false, false,  false, false, false, false, false, true, false, false
    ],

    // constants for player state values
    STATE: {
      TEE : -1,
      INACTIVE : 0,
      PRIMARY : 1,
      COMPARE : 2,
      GHOST : 3
    },

    VIEW: {
      fairway: 0,
      green: 1
    },

    COLORS: {
      1 : ['#EDD206'],
      2 : ['#89C7FD','#80D856']
    },

    // custom darken navigation elements if on green view for defined holes
    HOLES_TO_DARKEN: [6,12,13,18],

    // offsets are distance from top left to point where image should be positioned
    // i.e. center of cup, center of ball, point of marker, etc
    PIN_WIDE : {
      ID : 'flagstickwide',
      W_OFFSET : 7,
      H_OFFSET : 44,
      WIDTH : 22,
      HEIGHT : 48,
      SCALE: 0.75
    },
    PIN_CLOSE : {
      ID : 'flagstickclose',
      W_OFFSET : 7,
      H_OFFSET : 77,
      WIDTH : 24,
      HEIGHT : 80,
      SCALE: 0.50
    },
    BALL : { // don't need right now, using canvas drawn version
      ID : 'ball',
      W_OFFSET : 6,
      H_OFFSET : 6,
      WIDTH : 14,
      HEIGHT : 14
    },
    MARKER : {
      W_OFFSET : 10,
      H_OFFSET : 10
    },
    GHOST_MARKER : {
      W_OFFSET : 4,
      H_OFFSET : 4
    },
    SCORE_MARKER : {
      W_OFFSET : -3
    },

    // offset values in OFFSET is based on these container values
    // WIDTH : 2048,
    // OLD_HEIGHT : 1536,
    // NEW_HEIGHT : 1152,
    WIDTH : 1440,
    OLD_HEIGHT : 1080,
    NEW_HEIGHT : 1080,
    CROP_OFFSET : 0, // (1080 - 810) / 2,

    ERRORS : {
      wd : {
        header : 'Withdrawn',
        msg : '#{name} has withdrawn from the Tournament, and this round is no longer available. Click below to see the current leader.'
      },
      dq : {
        header : 'Disqualified',
        msg : '#{name} has been disqualified from the Tournament, and this round is no longer available. Click below to see the current leader.'
      },
      data : {
        header : 'Please wait',
        msg : 'Currently validating shot data.'
      },
      ns : {
        header : 'Player Not Active',
        msg : '#{name} has not yet teed off. Click below to see the current leader.'
      },
      id : {
        header : 'Player Does Not Exist',
        msg : 'This player does not exist. Click below to see the current leader on course.'
      }
    }
  }

  return Constants;
});
