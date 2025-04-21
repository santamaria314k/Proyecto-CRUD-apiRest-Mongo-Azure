document.addEventListener("DOMContentLoaded", () => {
    const userForm = document.getElementById("userForm");
    const userTable = document.getElementById("userTable");
    const avatarInput = document.getElementById("avatarInput");
    const preview = document.getElementById("preview");
    const modalTitle = document.getElementById("modalTitle");

    const API_URL = "http://localhost:4500/trabajo";
    let users = [];
    let editId = null;

    avatarInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    loadUsers();

    async function loadUsers() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Error al cargar usuarios");

            const data = await response.json();
            if (data.success) {
                users = data.data;
                renderTable();
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al cargar usuarios");
        }
    }

    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", document.getElementById("nombre").value);
        formData.append("lastName", document.getElementById("apellido").value);
        formData.append("phone", document.getElementById("telefono").value);
        formData.append("birthdate", document.getElementById("fechaNacimiento").value);

        const file = avatarInput.files[0];
        if (file) {
            formData.append("avatar", file);
        }

        try {
            let response;
            if (editId) {
                response = await fetch(`${API_URL}/with-image/${editId}`, {
                    method: "PUT",
                    body: formData,
                });
            } else {
                response = await fetch(`${API_URL}/with-image`, {
                    method: "POST",
                    body: formData,
                });
            }

            if (!response.ok) throw new Error("Error al guardar usuario");

            const data = await response.json();
            if (data.success) {
                loadUsers();
                resetForm();
                bootstrap.Modal.getInstance(document.getElementById("userModal")).hide();
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });

    function resetForm() {
        userForm.reset();
        preview.src = "";
        preview.style.display = "none";
        editId = null;
        modalTitle.textContent = "Agregar Usuario";
        avatarInput.required = true;
    }

    function renderTable() {
        userTable.innerHTML = "";
        users.forEach((user, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td>${user.lastName}</td>
                <td>${user.phone}</td>
                <td>${new Date(user.birthdate).toISOString().split('T')[0]}</td>
                <td><img src="${user.imgUrl}" class="avatar" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editUser('${user._id}')">✏</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">🗑</button>
                </td>
            `;
            userTable.appendChild(row);
        });
    }

    window.editUser = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) throw new Error("Error al cargar usuario");

            const data = await response.json();
            if (data.success) {
                const user = data.data;
                document.getElementById("nombre").value = user.name;
                document.getElementById("apellido").value = user.lastName;
                document.getElementById("telefono").value = user.phone;
                document.getElementById("fechaNacimiento").value = new Date(user.birthdate).toISOString().split("T")[0];

                preview.src = user.imgUrl || "";
                preview.style.display = user.imgUrl ? "block" : "none";

                editId = id;
                modalTitle.textContent = "Editar Usuario";
                avatarInput.required = false;

                new bootstrap.Modal(document.getElementById("userModal")).show();
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al cargar usuario para editar");
        }
    };

    window.deleteUser = async (id) => {
        if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE",
                });
                if (!response.ok) throw new Error("Error al eliminar usuario");

                const data = await response.json();
                if (data.success) {
                    loadUsers();
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Error al eliminar usuario");
            }
        }
    };
});
