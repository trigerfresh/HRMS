const formatDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

const formatDateAndTime = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB");
};

const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // ✅ YYYY-MM-DD
};

export function numberToWords(num) {
  if (num === null || num === undefined) return "";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(num) {
    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num)
      .substr(-9)
      .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";

    let str = "";
    str +=
      n[1] != 0
        ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore "
        : "";
    str +=
      n[2] != 0
        ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh "
        : "";
    str +=
      n[3] != 0
        ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand "
        : "";
    str +=
      n[4] != 0
        ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred "
        : "";
    str +=
      n[5] != 0
        ? (str != "" ? "and " : "") +
          (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
        : "";
    return str.trim();
  }

  // Split rupees & paise
  let [rupees, paise] = num.toString().split(".");
  rupees = parseInt(rupees);
  paise = paise ? parseInt(paise.padEnd(2, "0")) : 0;

  let words = inWords(rupees) + " Rupees";

  if (paise > 0) {
    words += " and " + inWords(paise) + " Paise";
  }

  return words + " Only";
}

const toFixed2 = (num) => Number((num || 0).toFixed(2));

const customSelectStyles = {
  multiValue: (provided, state) => ({
    ...provided,
    backgroundColor: "#28599c",
    color: "white",
  }),

  multiValueLabel: (provided) => ({
    ...provided,
    color: "white",
    // fontWeight: "500",
  }),

  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#79a5e5" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(134,183,254,.25)" : "none",
    "&:hover": {
      borderColor: "#79a5e5",
    },
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "#79a5e5" //#86b7fe
      : state.isSelected
      ? "#79a5e5"
      : "white",
    color: state.isFocused || state.isSelected ? "white" : "black",
    cursor: "pointer",
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export {
  formatDDMMYYYY,
  formatDateAndTime,
  formatDateForInput,
  toFixed2,
  customSelectStyles,
};
