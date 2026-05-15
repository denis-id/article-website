import Swal from "sweetalert2";

export const authAlert = ({
  type = "success",
  title = "Berhasil",
  dark = false,
}) => {
  Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: type,
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,

    background: dark
      ? "rgba(17,24,39,0.92)"
      : "rgba(255,255,255,0.92)",

    color: dark ? "#f9fafb" : "#111827",

    backdrop: false,

    customClass: {
      popup: "theme-alert",
    },
  });
};