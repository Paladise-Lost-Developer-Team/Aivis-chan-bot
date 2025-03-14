import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection } from "discord.js";
import { deployCommands } from "./deploy-commands"; // 相対パスを使用してインポート
import { REST } from "@discordjs/rest";
import * as fs from "fs";
import { TOKEN } from "./config.json";
import { AivisAdapter, loadAutoJoinChannels, deleteJoinChannelsConfig, loadJoinChannels } from "./TTS-Engine"; // 相対パスを修正
import { ServerStatus, fetchUUIDsPeriodically } from "./dictionaries"; // 相対パスを修正
import { MessageCreate } from "./MessageCreate";
import { VoiceStateUpdate } from "./VoiceStateUpdate";
import { logError } from "./utils/errorLogger";

interface ExtendedClient extends Client {
    commands: Collection<string, any>;
}

export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] }) as ExtendedClient;
client.commands = new Collection(); // コマンド用の Collection を作成

const rest = new REST({ version: '9' }).setToken(TOKEN);

// 未処理の例外をハンドリング
process.on('uncaughtException', (error) => {
    console.error('未処理の例外が発生しました：', error);
    logError('uncaughtException', error);
    // クラッシュが深刻な場合は再起動させる（PM2が再起動を担当）
    if (error.message.includes('FATAL') || error.message.includes('CRITICAL')) {
        console.error('深刻なエラーのため、プロセスを終了します。');
        process.exit(1);
    }
});

// 未処理のPromiseリジェクトをハンドリング
process.on('unhandledRejection', (reason, promise) => {
    console.error('未処理のPromiseリジェクションが発生しました：', reason);
    logError('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason)));
});

// グレースフルシャットダウン処理
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
    console.log('シャットダウン中...');
    // voice connectionsはclient.destroy()で自動的に切断される
    
    // Discordクライアントからログアウト
    await client.destroy();
    console.log('正常にシャットダウンしました');
    process.exit(0);
}

client.once(Events.ClientReady, async () => {
    try {
        await deployCommands();
        MessageCreate(client); // 非同期関数として呼び出す
        VoiceStateUpdate(client); // 非同期関数として呼び出す
        AivisAdapter();
        console.log("起動完了");
        client.user!.setActivity("起動中…", { type: ActivityType.Playing });
        setInterval(async () => {
            try {
                const joinServerCount = client.guilds.cache.size;
                await client.user!.setActivity(`サーバー数: ${joinServerCount}`, { type: ActivityType.Custom });
                await new Promise(resolve => setTimeout(resolve, 15000));
                const joinVCCount = client.voice.adapters.size;
                client.user!.setActivity(`VC: ${joinVCCount}`, { type: ActivityType.Custom });
                await new Promise(resolve => setTimeout(resolve, 15000));
            } catch (error) {
                console.error("ステータス更新エラー:", error);
                logError('statusUpdateError', error instanceof Error ? error : new Error(String(error)));
            }
        }, 30000);

        fetchUUIDsPeriodically();
        client.guilds.cache.forEach(guild => {
            try {
                new ServerStatus(guild.id); // 各ギルドのIDを保存するタスクを開始
            } catch (error) {
                console.error(`Guild ${guild.id} のステータス初期化エラー:`, error);
                logError('serverStatusError', error instanceof Error ? error : new Error(String(error)));
            }
        });
    } catch (error) {
        console.error("Bot起動エラー:", error);
        logError('botStartupError', error instanceof Error ? error : new Error(String(error)));
    }
});

client.on(Events.InteractionCreate, async interaction => {    
    if (!interaction.isChatInputCommand()) return;

    // Bot起動時にloadAutoJoinChannels()関数を実行
    loadAutoJoinChannels();
    loadJoinChannels();
    console.log("Auto join channels loaded.");

    try {

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'このコマンドの実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'このコマンドの実行中にエラーが発生しました', flags: MessageFlags.Ephemeral });
            }
        }
    } catch (error) {
        console.error(error);
    }
});

client.login(TOKEN).catch(error => {
    console.error("ログインエラー:", error);
    logError('loginError', error);
    process.exit(1);
});