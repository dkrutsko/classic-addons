
//----------------------------------------------------------------------------//
// Main                                                                       //
//----------------------------------------------------------------------------//

window.addEventListener ('load', () =>
{
	////////////////////////////////////////////////////////////////////////////////

	const GAMES = [ 'retail', 'classic' ];

	////////////////////////////////////////////////////////////////////////////////

	const toLink =
	{
		curse: slug => `https://curseforge.com/wow/addons/${slug}`,
		wowi : slug => `https://wowinterface.com/downloads/info${slug}`,
		repo : slug => `https://github.com/${slug}`
	};

	////////////////////////////////////////////////////////////////////////////////

	const toWoWA =
	{
		curse: slug => `wowa add curse:${slug}`,
		wowi : slug => `wowa add wowinterface:${slug}`,
		repo : slug => `wowa add ${slug}`
	};

	////////////////////////////////////////////////////////////////////////////////

	// Creates a hyperlink which links to some external website
	const ExternalLink = function ({ href, children, ...props })
	{
		return (
			<a {...props}
				target='_blank' href={href}
				rel='noopener noreferrer'>
				{children}
			</a>
		);
	};

	////////////////////////////////////////////////////////////////////////////////

	// Creates a hyperlink which copies `text` to the clipboard
	const CopyableLink = function ({ text, children, ...props })
	{
		// Performs the copy action
		const copyText = function (e)
		{
			e.preventDefault ();
			e.stopPropagation();

			// Create textarea element and set its text value
			const input = document.createElement ('textarea');
			input.value = text;

			// Add the input to the document
			document.body.appendChild (input);

			input.select();
			// Select the text and copy it
			document.execCommand ('copy');

			// Remove input from the document
			document.body.removeChild (input);
		};

		//----------------------------------------------------------------------------//

		// Poor mans version of merging the class property
		const classes = `copy-link ${props.class || ''}`;

		//----------------------------------------------------------------------------//

		return (
			<a {...props} onClick={copyText}
				className={classes} href='#'>
				{children}
			</a>
		);
	};

	////////////////////////////////////////////////////////////////////////////////

	// Renders a single row within the addon table
	const AddonRow = function ({ children: addon })
	{
		// Link to the addon website if there is one
		const website = !addon.website ? addon.name :
		(
			<ExternalLink href={addon.website}>
				{addon.name}
			</ExternalLink>
		);

		//----------------------------------------------------------------------------//

		let preferred = addon.preferred;

		if (!preferred)
		{
			if (addon.curse) preferred = 'curse'; else
			if (addon.wowi ) preferred = 'wowi';  else
			if (addon.repo ) preferred = 'repo';
		}

		//----------------------------------------------------------------------------//

		// Renders service using specified parameters
		const Service = function ({ name, children })
		{
			if (!addon[name])
				return null;

			const result =
			(
				<React.Fragment>
					<ExternalLink href={toLink[name] (addon[name])}>
						{children}
					</ExternalLink>
					<br />
					<CopyableLink text={toWoWA[name] (addon[name])} className='text-monospace'>
						Copy WoWA
					</CopyableLink>
				</React.Fragment>
			);

			return preferred === name ? <strong>{result}</strong> : result;
		};

		//----------------------------------------------------------------------------//

		return (
			<tr>
				<td className='text-center text-success align-middle tip noselect'></td>
				<td className='align-middle'>{website}</td>
				<td className='text-center'><Service name='curse'>Curse Forge</Service></td>
				<td className='text-center'><Service name='wowi' >WoW Interface</Service></td>
				<td className='text-center'><Service name='repo' >GitHub</Service></td>
			</tr>
		);
	};

	////////////////////////////////////////////////////////////////////////////////

	const Loader = function()
	{
		return (
			<div className='loader'>
				<div className='line-1'></div>
				<div className='line-2'></div>
				<div className='line-3'></div>
			</div>
		);
	};

	////////////////////////////////////////////////////////////////////////////////

	// Main rendering component
	const MainRender = function()
	{
		// Controls if application is in the initial loading stage
		const [ isLoading, setIsLoading ] = React.useState (false);

		// Controls the primary application addon lists
		const [ data, setData ] = React.useState ({ });

		React.useEffect (() =>
		{
			// Set loading state
			setIsLoading (true);

			// Begin loading all the games data
			const promises = GAMES.map (game =>
			{
				return new Promise ((accept, reject) =>
				{
					// Fetch and parse addons
					Papa.parse (`${game}.csv`,
					{
						download: true,
						dynamicTyping: true,
						header: true,
						skipEmptyLines: true,

						// Parsing error
						error: error =>
						{
							reject (error);
						},

						// Parsing complete
						complete: result =>
						{
							setData (data => ({ ...data, [game]: result.data }));
							accept();
						}
					});
				});
			});

			// Wait for everything to download
			Promise.all (promises).then (() =>
			{
				// Set loading state
				setIsLoading (false);
			});

		}, [ ]);

		//----------------------------------------------------------------------------//

		const [ game, setGame ] = React.useState (GAMES[0]);

		// When the game needs to be switched
		const onSwitchGame = function (e, game)
		{
			e.preventDefault ();
			e.stopPropagation();
			setGame (game);
		};

		const addons = data[game] || [ ];

		//----------------------------------------------------------------------------//

		const [ filter, setFilter ] = React.useState ('');

		// Needed so that input can be focused
		const filterInput = React.createRef();

		//----------------------------------------------------------------------------//

		// Normalize string to remove bad search tokens
		const normalize = s => s.replace (/\s|'/g, '');

		let    regex = /.*/i;
		let badRegex = false;

		try
		{
			regex = new RegExp (
				// Create regex from filter state
				`.*${normalize (filter)}.*`, 'i'
			);
		}

		// Make sure to highlight text
		catch (e) { badRegex = true; }

		//----------------------------------------------------------------------------//

		// Renders links for mass copying all column data
		const CopyAll = function ({ service, children })
		{
			const links = [ ];
			const wowas = [ ];

			// Iterate through addons
			for (let addon of addons)
			{
				let s = service;
				// Check for special preferred copying
				if (s === 'preferred' && !(s = addon[s]))
				{
					if (addon.curse) s = 'curse'; else
					if (addon.wowi ) s = 'wowi';  else
					if (addon.repo ) s = 'repo';
				}

				if (addon[s] && regex.test (normalize (addon.name)))
				{
					links.push (toLink[s] (addon[s]));
					wowas.push (toWoWA[s] (addon[s]));
				}
			}

			return (
				<React.Fragment>
					Copy All to Clipboard
					<br />
					<CopyableLink text={links.join ('\n') + '\n'}>
						{children}
					</CopyableLink>
					&nbsp;|&nbsp;
					<CopyableLink text={wowas.join ('\n') + '\n'}>
						WoWA
					</CopyableLink>
				</React.Fragment>
			);
		};

		//----------------------------------------------------------------------------//

		// Return loader if still loading
		if (isLoading) return <Loader />;

		return (
			<div className='container'>
			<div className='row'>
			<div className='col'>

				<h3 className='mt-4 mb-2 text-center text-uppercase'>
					<strong>WoW Addon List</strong>
				</h3>

				<div class="mb-4 text-center">
					{GAMES.map (curr => (
						<a onClick={e => onSwitchGame (e, curr)}
							className='mx-2 copy-link' href='#'>
							{game === curr ?
								<strong>{curr}</strong> : curr
							}
						</a>
					))}
				</div>

				<table className='table my-0'>
				<thead>
					<tr>
						<th width='6%' className='text-center text-muted align-middle noselect'>
							<i className='material-icons align-middle cursor-pointer'
								tabIndex='-1' onClick={() => filterInput.current.focus()}>
								search
							</i>
						</th>

						<th width='28%'>
							<input aria-label='Filter Addons'
								placeholder={`Addon Name (${addons.length})`} ref={filterInput}
								type='text' value={filter} onChange={e => setFilter (e.target.value)}
								className={`form-control header ${badRegex ? 'text-danger' : ''}`} />
						</th>

						<th width='22%' className='text-center text-muted align-middle'>Curse Forge</th>
						<th width='22%' className='text-center text-muted align-middle'>WoW Interface</th>
						<th width='22%' className='text-center text-muted align-middle'>GitHub</th>
					</tr>
				</thead>
				<tbody>

					{addons.map (addon => (
						regex.test (normalize (addon.name)) && <AddonRow key={addon.name}>{addon}</AddonRow>
					))}

					<tr>
						<td className='text-center text-muted align-middle tip noselect'></td>
						<td className='text-center'><CopyAll service='preferred'>Preferred    </CopyAll></td>
						<td className='text-center'><CopyAll service='curse'    >Curse Forge  </CopyAll></td>
						<td className='text-center'><CopyAll service='wowi'     >WoW Interface</CopyAll></td>
						<td className='text-center'><CopyAll service='repo'     >GitHub       </CopyAll></td>
					</tr>

				</tbody>
				</table>

				<hr className='my-0' />

				<p className='text-center my-3'>
					<ExternalLink href='https://github.com/antiwinter/wowa'>
						CLI for WoW Addons
					</ExternalLink>
				</p>

			</div>
			</div>
			</div>
		);
	};

	////////////////////////////////////////////////////////////////////////////////

	// Perform render
	ReactDOM.render (
		React.createElement (MainRender),
		document.getElementById ('main')
	);
});
