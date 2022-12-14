/**
 * @name InfoBackup
 * @author rafa_br34
 * @authorId 642064514476408832
 * @version 0.0.5
 * @description Allows you to backup your friend list in a file with automatic backups
 * @invite BztRQ9t67N
 * @donate https://www.buymeacoffee.com/rafabr34
 * @website https://rafa-br34.github.io/
 * @source https://github.com/rafa-br34/BetterDiscordPlugins/blob/main/InfoBackup.plugin.js
 * @updateUrl https://raw.githubusercontent.com/rafa-br34/BetterDiscordPlugins/main/InfoBackup.plugin.js
 */


function DBG() {
	//console.log(...arguments)
}

var PluginConfig = {
	"PluginInfo": {
		"Name": "InfoBackup",
		"Author": "rafa_br34",
		"Version": "0.0.5",
		"Description": "Allows you to backup your friend list in a file with automatic backups",
		"GitHubRaw": "https://raw.githubusercontent.com/rafa-br34/BetterDiscordPlugins/main/InfoBackup.plugin.js"
	},
	"PluginConfig": {
		"FileSavingDelay": (60 * (60 * 1000))
	}
};

module.exports = (function () {

	var G_Running = false;

	function Sleep(DelayMS) {
		return new Promise(Resolve => setTimeout(Resolve, DelayMS));
	}


	var Request = require("request")
	var Path = require("path")
	var FileSystem = require("fs");


	if (!global.ZeresPluginLibrary) {
		return class {
			getName() { return PluginConfig.PluginInfo.Name; }
			getAuthor() { return PluginConfig.PluginInfo.Author; }
			getVersion() { return PluginConfig.PluginInfo.Version; }
			getDescription() { return `${PluginConfig.PluginInfo.Name} Needs ZeresPluginLibrary To Work.`; }

			downloadLibrary() {
				Request.get("https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js", (Error, ResponseStatus, FileData) => {
					if (!Error && FileData && ResponseStatus.statusCode == 200) {
						FileSystem.writeFile(
							Path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"),
							FileData,
							() => BdApi.UI.showToast("Successfully Installed ZeresPluginLibrary!", { type: "success" })
						);
					}
					else BdApi.alert("Error", "Failed To Download ZeresPluginLibrary. Try Again Later Or Download Manually From GitHub: https://github.com/rauenzi/BDPluginLibrary");
				});
			}

			load() {
				if (!global.ZeresPluginLibrary) {
					BdApi.showConfirmationModal("Library Missing", `${PluginConfig.PluginInfo.Name} Needs ZeresPluginLibrary To Work.`, {
						confirmText: "Download Now",
						cancelText: "Cancel",
						onCancel: _ => { return },
						onConfirm: _ => {
							this.downloadLibrary();
						}
					});
				}
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
		return (([Plugin, ZeresPluginLibrary]) => {

			function SaveBackupFile() {
				DBG("Backup")

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
					var Relationships = ZeresPluginLibrary.DiscordModules.RelationshipStore.getRelationships();
					var Users = ZeresPluginLibrary.DiscordModules.UserStore.getUsers();
					DBG("Cached Users:", Object.keys(Users).length, "Relationships:", Object.keys(Relationships).length)

					for (var ID in Relationships) {
						if (Relationships[ID] != 1) { continue }
						var User = Users[ID]
						var NameWithTag = User.tag || `${User.username}#${User.discriminator}`
						Friends.push({ "Name": NameWithTag, "Id": User.id })
					}
				}
				DBG("Friends:", Friends.length)

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
				constructor() { super() }
				getDescription() { return PluginConfig.PluginInfo.Description; }
				getVersion() { return PluginConfig.PluginInfo.Version; }
				getAuthor() { return PluginConfig.PluginInfo.Author; }
				getName() { return PluginConfig.PluginInfo.Name }



				start() {
					var Config = BdApi.Data.load(PluginConfig.PluginInfo.Name, "__CONFIG")
					if (Config) {
						PluginConfig.PluginConfig = Config
					}
					G_Running = true;



					(async function () {
						while (!global.ZeresPluginLibrary || !ZeresPluginLibrary.DiscordModules || !ZeresPluginLibrary.DiscordModules.UserStore) {
							await Sleep(5000);
						}
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
							finally { }
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
						TimePrompt.value = String(PluginConfig.PluginConfig.FileSavingDelay / (60 * (60 * 1000)))
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
							DBG("New Saving Delay Info ", Number, PluginConfig.PluginConfig.FileSavingDelay)
						}
						TimePrompt.addEventListener("change", Function)

						TimeDiv.append(TimeTextLabel, TimePrompt);
					}

					Settings.append(TimeDiv);

					return Settings;
				}

				stop() {
					G_Running = false
					BdApi.Data.save(PluginConfig.PluginInfo.Name, "__CONFIG", PluginConfig.PluginConfig)
				}
			}
		})(ZeresPluginLibrary.buildPlugin({
			name: PluginConfig.PluginInfo.Name,
			version: PluginConfig.PluginInfo.Version,
			github_raw: PluginConfig.PluginInfo.GitHubRaw
		}))
	}
})()
