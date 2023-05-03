import toast from '../../../components/toast/toast';
import globalize from '../../../scripts/globalize';
import Events from '../../../utils/events.ts';
import ServerConnections from '../../../components/ServerConnections';

export default function (view) {
    function submit(e) {
        e?.preventDefault();
        const apiId = view.querySelector('#txtNewApiId').value;
        const apiKey = view.querySelector('#txtNewApiKey').value;

        const apiClient = ServerConnections.currentApiClient();
        apiClient.fetch({
            url: apiClient.getUrl('Spotify/ApiId'),
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({
                apiId: apiId,
                apiKey: apiKey,
            }),
            contentType: 'application/json',
        }).then((result) => {
            console.log(`Spotify SetApi result : ${result}`);
            if (result) {
                toast(globalize.translate('SettingsSaved'));
                Events.trigger(view, 'saved');
            } else {
                toast("Error, couldn't validate spotify API Key/Id");
            }
        }).catch((error) => {
            toast(`Error, couldn't validate spotify API Key/Id : ${JSON.stringify(error)}`);
        });

        return false;
    }

    view.addEventListener('viewshow', function () {
        const apiClient = ServerConnections.currentApiClient();
        let tokenUrl = apiClient.getUrl('Spotify/ApiId');
        apiClient.getJSON(tokenUrl).then((apiId) => {
            view.querySelector('#txtNewApiId').value = apiId;
        });
        view.querySelector('form').addEventListener('submit', submit);
        view.querySelector('.btnSave').classList.remove('hide');

        import('../../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(view);
        });
    });
}
