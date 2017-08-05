jQuery('input[type="submit"]').click((e) => {

	e.preventDefault();

	let data = {};

	jQuery('.data-field').each((i, el) => {

		if(!el.value){

			el.style = 'background: red;';

			data = false;

		} else if(data){

			el.style = '';

			data[el.name] = el.value;

		}

	});

	if(!data) { return; }

	jQuery('.status').empty();

	jQuery.ajax({
		type: 'POST',
		url: '/',
		data: data,
		xhr: () => {

			let xhr = new window.XMLHttpRequest(), resp;

			xhr.addEventListener('progress', (e) => {

				resp = e.currentTarget.response;

				jQuery('.status').html(resp);

			});

			return xhr;

		},
	})

});