<script lang="ts">
    import * as txml from 'txml'
    import pako from 'pako'

    let files
    let data = []
    
    let query = ''
    
    let selected_index
    let selected_request = ''
    let selected_response = ''
    
    $: filtered = data.filter(item => item.host.toLowerCase().includes(query?.toLowerCase()) || item.path.toLowerCase().includes(query?.toLowerCase()))
    $: parse(files)
    $: update(selected_index)

    let parse = files => {
        if (files && files[0]) {
            const reader = new FileReader()
            reader.onload = e => data = txml.filter(txml.parse(e.target.result), node => node.tagName === 'item')
                .map((item, index) => item.children.reduce((obj, child) => {
                    if (child.tagName === 'host') {
                        obj.ip = child.attributes.ip
                    }
                    if (child.children?.[0]) {
                        if (child.tagName === 'request' || child.tagName === 'response') {
                            if (child.attributes.base64 === 'true') {
                                child.children[0] = window.atob(child.children[0])
                            }
                            if (child.children[0].split('\n').map(x => x.trim().toLowerCase() === 'content-encoding: gzip').some(Boolean)) {
                                if (child.attributes.base64 === 'true') {
                                    let [headers, body] = child.children[0].split(/\r\n\r\n/)
                                    child.children[0] = headers + '\r\n\r\n' + decode_gzip(body)
                                } else {
                                    console.error('cannot decode gzip without base64 encoding', item)
                                }
                            }
                            child.children[0] = child.children[0].replace(/\r\n/g, '<br>')
                        }
                        obj[child.tagName] = child.children[0]
                    }
                    obj.index = index + 1
                    return obj
                }, {}))
            reader.readAsText(files[0])
            reset()
        }
    }

    let reset = () => {
        query = ''
        selected_index = undefined
        selected_request = ''
        selected_response = ''
    }

    let update = selected => {
        let item = data.find(item => item.index === selected)
        if (item) {
            selected_request = item.request
            selected_response = item.response
        } else {
            selected_request = ''
            selected_response = ''
        }
    }

    let decode_gzip = str => String.fromCharCode.apply(null, new Uint16Array(pako.inflate(new Uint8Array(str.split('').map(x => x.charCodeAt(0))))))
</script>

<div class="flex flex-col w-full h-full px-4 pb-4 pt-2">
    <div class="flex justify-between items-center">
        <div class="flex flex-col">
            <div class="font-semibold text-lg">Burp Request Explorer</div>
            <div>by <a href="https://github.com/limi7break" target="_blank" class="text-blue-500 hover:underline cursor-pointer">limi7break <i class="fab fa-github"></i></a></div>
        </div>
        <input type="file" bind:files class="text-right p-2 border border-gray-500 rounded-md">
    </div>
    <div class="flex flex-col flex-grow min-h-0">
        <div class="flex gap-2 py-2">
            <input type="text" placeholder="search by Host or URL..." bind:value={query} class="w-full rounded-md h-6 p-2 border border-gray-500">
        </div>
        <div class="flex-grow h-[45%] min-h-[45%] max-h-[45%] border-x border-t border-gray-500 mt-1 rounded-t-md" data-simplebar>
            <div class="grid" style="grid-template-columns: repeat(3, auto) 1fr repeat(6, auto)">
                <div class="header row">
                    <div>#</div>
                    <div>Method</div>
                    <div>Host</div>
                    <div>URL</div>
                    <div>Status</div>
                    <div>Length</div>
                    <div>MIME</div>
                    <div>Extension</div>
                    <div>IP</div>
                    <div>Time</div>
                </div>
                {#each filtered ?? [] as item}
                <div class="content row" class:selected={selected_index === item.index} on:click={() => selected_index = item.index}>
                    <div>{item.index ?? ''}</div>
                    <div>{item.method ?? ''}</div>
                    <div>{`${item.protocol}://${item.host}`}</div>
                    <div>{item.path ?? ''}</div>
                    <div>{item.status ?? ''}</div>
                    <div>{item.responselength ?? ''}</div>
                    <div>{item.mimetype ?? ''}</div>
                    <div>{item.extension === 'null' ? '' : item.extension ?? ''}</div>
                    <div>{item.ip ?? ''}</div>
                    <div>{item.time ?? ''}</div>
                </div>
                {/each}
            </div>
        </div>
        <div class="flex flex-grow min-h-0">
            <div class="flex-grow min-h-0 w-1/2 border border-gray-500 rounded-bl-md" data-simplebar>
                <div class="font-mono text-xs p-2">
                    {@html selected_request}
                </div>
            </div>
            <div class="flex-grow min-h-0 w-1/2 border-y border-r border-gray-500 rounded-br-md" data-simplebar>
                <div class="font-mono text-xs p-2">
                    {@html selected_response}
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="postcss">
    .header.row, .content.row {
        @apply contents;
    }

    .header.row > div:last-child,
    .content.row > div:last-child {
        @apply pr-4;
    }

    .content.row:hover > div {
        @apply bg-gray-100;
    }

    .content.row.selected > div {
        @apply bg-gray-200;
    }
    
    .header.row > div {
        @apply pl-2 font-semibold bg-gray-300;
    }

    .content.row > div {
        @apply pl-2 h-5 overflow-hidden cursor-pointer;
    }
</style>
