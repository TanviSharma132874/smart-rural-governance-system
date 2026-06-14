const LOCATION_HIERARCHY = {
  Rajasthan: {
    Jaipur: {
      Tehsils: {
        Amber: {
          type: "Rural",
          Panchayats: ["Kukas", "Amber Rural"],
          Villages: ["Kukas", "Banskho"],
        },
        Sanganer: {
          type: "Urban",
          Municipalities: ["Jaipur Municipal Corporation"],
          Wards: ["Ward 1", "Ward 2", "Ward 3"],
        },
      },
    },
    Sikar: {
      Tehsils: {
        Laxmangarh: {
          type: "Rural",
          Panchayats: ["Laxmangarh Rural", "Nechhwa"],
          Villages: ["Mirjapur", "Palas"],
        },
        Sikar: {
          type: "Urban",
          Municipalities: ["Sikar Nagar Parishad"],
          Wards: ["Ward 10", "Ward 11"],
        },
      },
    },
    Udaipur: {
      Tehsils: {
        Girwa: {
          type: "Rural",
          Panchayats: ["Girwa Rural"],
          Villages: ["Sisarma", "Bujhara"],
        },
      },
    },
  },
};

module.exports = { LOCATION_HIERARCHY };
