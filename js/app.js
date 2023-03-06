function iniciarApp() {
   const resultado = document.querySelector('#resultado'); //html favoritos
   const selectCategorias = document.querySelector('#categorias');
   if(selectCategorias){
    selectCategorias.addEventListener('change', selecionarCategorias)
    obtenerCategorias();
   }
   
   const favoritosDiv = document.querySelector('.favoritos');
   if(favoritosDiv){
        obtenerFavoritos();
   }

  
   const modal = new bootstrap.Modal('#modal', {})

  
    
    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
        .then(respuesta =>{
            // console.log(respuesta)
             return respuesta.json();
        } )
        .then(resultado =>{
            mostrarCategorias(resultado.categories);
        })
    }

    function mostrarCategorias(categorias = []) {
       categorias.forEach(categoria =>{
        const { strCategory}= categoria;
        const option = document.createElement('OPTION');
        option.value = strCategory;
        option.textContent = categoria.strCategory;
        selectCategorias.appendChild(option);
        // console.log(categoria);
       })
    }

    function selecionarCategorias(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetas(resultado.meals))
    }

    function mostrarRecetas(recetas = []) {

        limpiarHTML(resultado);
        // console.log(recetas)

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados': 'No Hay Resultados';
        resultado.appendChild(heading)

        // Iterar en los resultados
        recetas.forEach(receta => {
            // console.log(receta);
            const{idMeal, strMeal, strMealThumb} = receta;

            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-warning', 'w-100');
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget = '#modal';
            // recetaButton.dataset.bsToggle = 'modal';
            recetaButton.onclick = function () {
                seleccionarReceta(idMeal ?? receta.id)
            }

            //Inyectar en el codigo HTML
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);

            resultado.appendChild(recetaContenedor);

            // console.log(recetaHeading);
        })
    }

    function seleccionarReceta(id) {
       const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
       fetch(url)
        .then(respuesta => respuesta.json())
        .then(resultado => mostrarRecetaModal(resultado.meals[0]))
    }

    function mostrarRecetaModal(receta) {
        // console.log(receta);
        const {idMeal, strInstructions, strMeal,strMealThumb} = receta;

        //Añadir contenido al modal 
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}"/>
            <h3 class="my-3">Instructions<h3>
            <p>${strInstructions}</P>
            <h3 class="my-3">Ingredientes y Cantidades</h3>

        `;
        
        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');
        // console.log(listGroup)
        //Mostrar Cantidades e ingredientes 
        for(let i = 1; i<=20; i++){
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad =  receta[`strMeasure${i}`]; 
                
                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`
                
                listGroup.appendChild(ingredienteLi);

            }
        }

        modalBody.appendChild(listGroup); // Muestra la lista de ingredientes en el HTML 

        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);

        //Botones cerrar y favorito 
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-warning', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        //Almacenar y quitar del localstorage 
        btnFavorito.onclick = function(){
            // console.log(existeStorage(idMeal))
            if(existeStorage(idMeal)){
                eliminarFavorito(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente');
                return
            }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
            });
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Guardado Correctamente');
        }

        const btnCerrarModal = document.createElement('BUTTON');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent = 'Cerrar';
        btnCerrarModal.onclick = function(){
            modal.hide(); // para ocultar el modal 
        }

        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrarModal);
        //Mostrar el modal 
        modal.show();
    }

    function agregarFavorito(receta) {
        // console.log(receta)
        // Obtiene del local storages y lo convierte a arreglo 
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []; //?? en caso de que la expresion del lado izquierdo marque null aplica lo que esta del lado derecho 
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
        
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));

    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id );
    }

    function mostrarToast(mensaje){
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;

        toast.show();

    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []; 
        // console.log(favoritos);
        if(favoritos.length){
            mostrarRecetas(favoritos);
            return
        }

        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay favoritos aún';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        favoritosDiv.appendChild(noFavoritos);
     

         
    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);