/**
 * @name InfoBackup
 * @author rafa_br34
 * @authorId 642064514476408832
 * @version 0.0.2
 * @description Adds utilities to backup Discord information(Friend list) in a file
 * @invite BztRQ9t67N
 * @donate https://www.buymeacoffee.com/rafabr34
 * @website https://rafa-br34.github.io/
 * @source https://github.com/rafa-br34/BetterDiscordPlugins/blob/main/InfoBackup.plugin.js
 * @updateUrl https://raw.githubusercontent.com/rafa-br34/BetterDiscordPlugins/main/InfoBackup.plugin.js
 */

module.exports = (function() {
	var PluginConfig = {
		"PluginInfo": {
			"Name": "InfoBackup",
			"Author": "rafa_br34",
			"Version": "0.0.1",
			"Description": "Adds utilities to backup Discord information(Friend list) in a file"
		},
		"PluginConfig": {
			"FileSavingDelay": (60 * (60 * 1000))
		}
	};

	var G_Running = false;

	function Sleep(DelayMS) {
		return new Promise(Resolve => setTimeout(Resolve, DelayMS));
	}

	function DBG() {
		console.log(...arguments)
	}

	const ChangeLog = {}

	if (!window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started)) {
		return class {
			getName() { return PluginConfig.PluginInfo.Name; }
			getAuthor() { return PluginConfig.PluginInfo.Author; }
			getVersion() { return PluginConfig.PluginInfo.Version; }
			getDescription() { return `The Library Plugin needed for ${PluginConfig.PluginInfo.Name} is missing. Open the Plugin Settings to download it. \n\n${PluginConfig.PluginInfo.Description}`; }

			downloadLibrary() {
				require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
					if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.UI.showToast("Finished downloading BDFDB Library", { type: "success" }));
					else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
				});
			}

			load() {
				if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, { pluginQueue: [] });
				if (!window.BDFDB_Global.downloadModal) {
					window.BDFDB_Global.downloadModal = true;
					BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${PluginConfig.PluginInfo.Name} is missing. Please click "Download Now" to install it.`, {
						confirmText: "Download Now",
						cancelText: "Cancel",
						onCancel: _ => { delete window.BDFDB_Global.downloadModal; },
						onConfirm: _ => {
							delete window.BDFDB_Global.downloadModal;
							this.downloadLibrary();
						}
					});
				}
				if (!window.BDFDB_Global.pluginQueue.includes(PluginConfig.PluginInfo.Name)) window.BDFDB_Global.pluginQueue.push(PluginConfig.PluginInfo.Name);
			}
			start() { this.load(); }
			stop() { }
			getSettingsPanel() {
				let template = document.createElement("template");
				template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${PluginConfig.PluginInfo.Name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
				template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
				return template.content.firstElementChild;
			}
		}
	}
	else {
		return (([Plugin, BDFDB]) => {

			function SaveBackupFile() {
				DBG("Backup")
				var FileSystem = require("fs");
				var Path = require("path")
				var Folder = Path.join(BdApi.Plugins.folder, "InfoBackupFolder")

				try {
					FileSystem.mkdir(Folder)
					DBG("Made Folder", Folder)
				}
				catch (Error) { }
				finally {
					DBG("Folder Exists")
				}

				
				var Friends = []
				{
					var FriendIds = BDFDB.LibraryStores.RelationshipStore.getFriendIDs();
					DBG("Friends: ", FriendIds.length)
					for (var ID of FriendIds) {
						var User = BDFDB.LibraryStores.UserStore.getUser(ID)
						var NameWithTag = User.tag || `${User.username}#${User.discriminator}`
						Friends.push({ "Name": NameWithTag, "Id": User.id })
					}
				}
				var Data = {
					"Info": {
						"FriendsAmount": Friends.length
					},
					"Friends": Friends
				}
				
				var FilePath = Path.join(Folder, "InfoBackup.json")
				DBG("FilePath:", FilePath)

				try {
					FileSystem.unlinkSync(FilePath)
				}
				catch (Error) {
					DBG("Failed To Unlink Reason:", Error)
				}
				finally { }

				FileSystem.writeFileSync(FilePath, JSON.stringify(Data, undefined, 3))
				DBG("Saved Info")

				return FilePath
				
			}

			return class InfoBackup extends Plugin {
				getDescription() { return PluginConfig.PluginInfo.Description; }
				getVersion() { return PluginConfig.PluginInfo.Version; }
				getAuthor() { return PluginConfig.PluginInfo.Author; }
				getName() { return PluginConfig.PluginInfo.Name }

				

				start() {
					var Config = BdApi.Data.load("InfoBackup", "__CONFIG")
					if (Config) {
						PluginConfig.PluginConfig = Config
					}
					G_Running = true;
					
					(async function () {
						while (G_Running) {
							BdApi.UI.showToast(`Saving Backup File...`, { type: "info", timeout: 3000 })
							try {
								var Path = SaveBackupFile()
								if (Path) {
									BdApi.UI.showToast(`Saved Backup File At ${Path}`, { type: "success", timeout: 5000 })
								}
							}
							catch (Error) {
								console.error(Error)
								BdApi.UI.showToast(`Failed To Save Backup File, Please Wait For An Update`, { type: "error", timeout: 5000 })
							}
							finally {}
							await Sleep(PluginConfig.PluginConfig.FileSavingDelay)
						}
					})()
				}
				onLoad() { }
				onStart() { this.start() }
				onStop() { this.stop() }

				getSettingsPanel() {
					const Settings = document.createElement("div");

					const TimeDiv = document.createElement("span")
					{
						const TimeTextLabel = document.createElement("span")
						TimeTextLabel.textContent = "Time Between Backups(h): ";
						TimeTextLabel.style = "color: var(--text-normal);"

						const TimePrompt = document.createElement("input");
						TimePrompt.type = "number";
						TimePrompt.value = "1"
						TimePrompt.min = "0.5"
						TimePrompt.max = "8"

						var Function = (Event) => {
							var Number = parseFloat(TimePrompt.value)
							if (Number < 0.5 || Number === NaN) {
								TimePrompt.value = "0.5"
								Function()
								return
							}
							else if (Number > 8 || Number === Infinity) {
								TimePrompt.value = "8"
								Function()
								return
							}
							PluginConfig.PluginConfig.FileSavingDelay = (60 * (60 * 1000)) * Number;
							DBG(Number, PluginConfig.PluginConfig.FileSavingDelay)
						}
						TimePrompt.addEventListener("change", Function)

						TimeDiv.append(TimeTextLabel, TimePrompt);
					}

					Settings.append(TimeDiv);

					return Settings;
				}

				stop() {
					G_Running = false
					BdApi.Data.save("InfoBackup", "__CONFIG", PluginConfig.PluginConfig)
				}
			}
		})(window.BDFDB_Global.PluginUtils.buildPlugin(ChangeLog))
	}
})()
