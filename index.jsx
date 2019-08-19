
// Fetch and parse addons
Papa.parse ("addons.csv",
{
	download: true,
	dynamicTyping: true,
	header: true,
	skipEmptyLines: true,

	// Parsing complete
	complete: result =>
	{
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
					target="_blank" href={href}
					rel="noopener noreferrer">
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
				event.preventDefault ();
				event.stopPropagation();

				// Create textarea element and set its text value
				const input = document.createElement ("textarea");
				input.value = text;

				// Add the input to the document
				document.body.appendChild (input);

				input.select();
				// Select the text and copy it
				document.execCommand ("copy");

				// Remove input from the document
				document.body.removeChild (input);
			};

			//----------------------------------------------------------------------------//

			// Poor mans version of merging the className property
			const classes = `copy-link ${props.className || ""}`;

			//----------------------------------------------------------------------------//

			return (
				<a {...props} onClick={copyText}
					className={classes} href="#">
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

			// Link to a Wowhead spotlight article
			const spotlight = addon.spotlight && (
				<ExternalLink href={`https://classic.wowhead.com/news=${addon.spotlight}`}>
					<img src="wowhead.png" class="wowhead" alt="Wowhead Addon Spotlight" />
				</ExternalLink>
			);

			//----------------------------------------------------------------------------//

			let preferred = addon.preferred;

			if (!preferred)
			{
				if (addon.curse) preferred = "curse"; else
				if (addon.wowi ) preferred = "wowi";  else
				if (addon.repo ) preferred = "repo";
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
						<CopyableLink text={toWoWA[name] (addon[name])} className="text-monospace">
							Copy WoWA
						</CopyableLink>
					</React.Fragment>
				);

				return preferred === name ? <strong>{result}</strong> : result;
			};

			//----------------------------------------------------------------------------//

			return (
				<tr>
					<td className="text-center text-success align-middle tip noselect">
						{addon.supported &&
							<React.Fragment>
								<i className="material-icons align-middle">
									<strong>check</strong>
								</i>
								<span className="text">Official Support for Classic</span>
							</React.Fragment>}
					</td>
					<td className="align-middle">{website} {spotlight}</td>
					<td className="text-center"><Service name="curse">Curse Forge</Service></td>
					<td className="text-center"><Service name="wowi" >WoW Interface</Service></td>
					<td className="text-center"><Service name="repo" >GitHub</Service></td>
				</tr>
			);
		};

		////////////////////////////////////////////////////////////////////////////////

		// Main rendering component
		const MainRender = function()
		{
			const [ filter, setFilter ] = React.useState ("");

			// Needed so that input can be focused
			const filterInput = React.createRef();

			//----------------------------------------------------------------------------//

			const [ showHidden, setShowHidden ] = React.useState (false);

			let addons = [ ];
			if (showHidden)
				addons = result.data.filter (addon => !!addon.hidden);
			else
				addons = result.data.filter (addon =>  !addon.hidden);

			//----------------------------------------------------------------------------//

			// Normalize string to remove bad search tokens
			const normalize = s => s.replace (/\s|'/g, "");

			let    regex = /.*/i;
			let badRegex = false;

			try
			{
				regex = new RegExp (
					// Create regex from filter state
					`.*${normalize (filter)}.*`, "i"
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
					if (addon[service] && regex.test (normalize (addon.name)))
					{
						links.push (toLink[service] (addon[service]));
						wowas.push (toWoWA[service] (addon[service]));
					}
				}

				return (
					<React.Fragment>
						Copy All to Clipboard
						<br />
						<CopyableLink text={links.join ("\n") + "\n"}>
							{children}
						</CopyableLink>
						&nbsp;|&nbsp;
						<CopyableLink text={wowas.join ("\n") + "\n"}>
							WoWA
						</CopyableLink>
					</React.Fragment>
				);
			};

			//----------------------------------------------------------------------------//

			return (
				<div className="container">
				<div className="row">
				<div className="col">

					<h3 className="my-4 text-center text-uppercase">Classic WoW Addon List</h3>

					<table className="table my-0">
					<thead>
						<tr>
							<th width="6%" className="text-center text-muted align-middle noselect">
								<i className="material-icons align-middle cursor-pointer"
									tabindex="-1" onClick={() => filterInput.current.focus()}>
									search
								</i>
							</th>

							<th width="28%">
								<input aria-label="Filter Addons"
									placeholder={`Addon Name (${addons.length})`} ref={filterInput}
									type="text" value={filter} onChange={e => setFilter (e.target.value)}
									className={`form-control header ${badRegex ? "text-danger" : ""}`} />
							</th>

							<th width="22%" className="text-center text-muted align-middle">Curse Forge</th>
							<th width="22%" className="text-center text-muted align-middle">WoW Interface</th>
							<th width="22%" className="text-center text-muted align-middle">GitHub</th>
						</tr>
					</thead>
					<tbody>

						{addons.map (addon => (
							regex.test (normalize (addon.name)) && <AddonRow key={addon.name}>{addon}</AddonRow>
						))}

						<tr>
							<td className="text-center text-muted align-middle tip noselect">
								<i className="material-icons align-middle cursor-pointer"
									tabindex="-1" onClick={() => setShowHidden (!showHidden)}>
									{showHidden ? "visibility_off" : "visibility"}
								</i>
								<span className="text">
									{showHidden ? "Hide" : "Show"} Problematic Addons
								</span>
							</td>

							<td></td>
							<td className="text-center"><CopyAll service="curse">Curse Forge  </CopyAll></td>
							<td className="text-center"><CopyAll service="wowi" >WoW Interface</CopyAll></td>
							<td className="text-center"><CopyAll service="repo" >GitHub       </CopyAll></td>
						</tr>

					</tbody>
					</table>

					<hr className="my-0" />

					<p className="text-center my-3">
						<ExternalLink href="https://github.com/antiwinter/wowa">
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
			document.getElementById ("main")
		);
	}
})
