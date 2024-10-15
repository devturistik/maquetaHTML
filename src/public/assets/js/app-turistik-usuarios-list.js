"use strict";

$(function () {
  const dtUserTable = $("#usuariosTable");

  if (dtUserTable.length) {
    const dt = dtUserTable.DataTable({
      ajax: {
        url: "/api/v1/usuarios",
        dataSrc: function (json) {
          if (json.usuarios && Array.isArray(json.usuarios)) {
            // Actualiza los contadores en el HTML
            $("#total-users").text(json.usuarios.length);
            $("#active-users").text(
              json.usuarios.filter((user) => user.activo).length
            );
            $("#inactive-users").text(
              json.usuarios.filter((user) => !user.activo).length
            );
            return json.usuarios;
          } else {
            console.error("Formato de datos inesperado:", json);
            alert("Error al cargar datos de usuarios.");
            return [];
          }
        },
        error: function (xhr, status, error) {
          console.error("Error en la solicitud AJAX:", status, error);
          alert(
            "Error al cargar datos. Verifica el endpoint o la conexión de red."
          );
        },
      },
      columns: [
        { data: null },
        { data: "id" }, // ID (Base64 codificado)
        { data: "nombre" },
        { data: "apellido" },
        { data: "departamento" },
        { data: "correo" },
        { data: "activo" },
        { data: null },
      ],
      columnDefs: [
        {
          targets: 0,
          orderable: false,
          checkboxes: {
            selectAllRender: '<input type="checkbox" class="form-check-input">',
          },
          render: () =>
            '<input type="checkbox" class="dt-checkboxes form-check-input">',
          searchable: false,
        },
        {
          targets: 1,
          render: (data) => `<span>${data}</span>`,
        },
        {
          targets: 6,
          render: (data) => {
            const statusClass = data ? "bg-label-success" : "bg-label-danger";
            const statusText = data ? "Activo" : "Inactivo";
            return `<span class="${statusClass}">${statusText}</span>`;
          },
        },
        {
          targets: -1,
          title: "Acciones",
          orderable: false,
          render: function (data, type, full) {
            const encodedId = full["id"];
            return `<div class="d-inline-block text-nowrap">
                <button class="btn btn-sm btn-icon btn-text-secondary rounded-pill waves-effect waves-light dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                  <i class="ti ti-dots-vertical ti-md"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end m-0">
                  <a href="javascript:void(0);" class="dropdown-item" onclick="viewUser('${encodedId}')">Ver</a>
                  <a href="javascript:void(0);" class="dropdown-item" onclick="editUser('${encodedId}')">Editar</a>
                  <a href="javascript:void(0);" class="dropdown-item" onclick="deleteUser('${encodedId}', this)">Suspender</a>
                </div>
              </div>`;
          },
        },
      ],
      order: [[1, "asc"]],
      dom:
        '<"card-header d-flex border-top rounded-0 flex-wrap py-0 flex-column flex-md-row align-items-start"' +
        '<"me-5 ms-n4 pe-5 mb-n6 mb-md-0"f>' +
        '<"d-flex justify-content-start justify-content-md-end align-items-baseline"<"dt-action-buttons d-flex flex-column align-items-start align-items-sm-center justify-content-sm-center pt-0 gap-sm-4 gap-sm-0 flex-sm-row"lB>>' +
        ">t" +
        '<"row"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>',
      lengthMenu: [7, 10, 20, 50, 70, 100],
      language: {
        sLengthMenu: "_MENU_",
        search: "",
        searchPlaceholder: "Buscar Usuario",
        info: "Mostrando _START_ a _END_ de _TOTAL_ entradas",
        paginate: {
          next: '<i class="ti ti-chevron-right ti-sm"></i>',
          previous: '<i class="ti ti-chevron-left ti-sm"></i>',
        },
      },
      buttons: [
        {
          extend: "collection",
          className:
            "btn btn-label-secondary dropdown-toggle me-4 waves-effect waves-light",
          text: '<i class="ti ti-upload me-1 ti-xs"></i>Exportar',
          buttons: [
            {
              extend: "excelHtml5",
              text: '<i class="ti ti-file-text me-2"></i>Excel',
              className: "dropdown-item",
              exportOptions: {
                columns: ":visible",
              },
              filename: "usuarios_" + new Date().toLocaleDateString(),
            },
            {
              extend: "pdfHtml5",
              text: '<i class="ti ti-file-text me-2"></i>PDF',
              className: "dropdown-item",
              exportOptions: {
                columns: ":visible",
              },
              filename: "usuarios_" + new Date().toLocaleDateString(),
              orientation: "landscape",
              pageSize: "LEGAL",
            },
            {
              extend: "print",
              text: '<i class="ti ti-printer me-2"></i>Imprimir',
              className: "dropdown-item",
              exportOptions: {
                columns: ":visible",
              },
              filename: "usuarios_" + new Date().toLocaleDateString(),
            },
            {
              extend: "copyHtml5",
              text: '<i class="ti ti-copy me-2"></i>Copiar',
              className: "dropdown-item",
              exportOptions: {
                columns: ":visible",
              },
              filename: "usuarios_" + new Date().toLocaleDateString(),
            },
            {
              extend: "csvHtml5",
              text: '<i class="ti ti-file me-2"></i>CSV',
              className: "dropdown-item",
              exportOptions: {
                columns: ":visible",
              },
              filename: "usuarios_" + new Date().toLocaleDateString(),
            },
          ],
        },
        {
          text: '<i class="ti ti-plus me-0 me-sm-1 ti-xs"></i><span class="d-none d-sm-inline-block">Agregar Usuario </span>',
          className:
            "add-new btn btn-primary ms-2 ms-sm-0 waves-effect waves-light",
          action: function () {
            window.location.href = `/usuarios/agregar`;
          },
        },
      ],
    });
  }

  // Ver usuario
  window.viewUser = function (encodedId) {
    window.location.href = `/usuarios/ver/${encodedId}`; // Redirigir a la ruta
  };

  // Editar usuario
  window.editUser = function (encodedId) {
    window.location.href = `/usuarios/editar/${encodedId}`;
  };

  window.deleteUser = function (encodedId) {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      // Realizar la solicitud POST para eliminar el usuario
      fetch(`/usuarios/eliminar/${encodedId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            alert("Usuario eliminado exitosamente.");
            location.reload();
          } else {
            alert("Error al eliminar el usuario.");
          }
        })
        .catch((error) => {
          console.error("Error en la solicitud:", error);
          alert("Error al eliminar el usuario.");
        });
    }
  };
});
