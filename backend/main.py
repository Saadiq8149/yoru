from fastapi import FastAPI
from fastapi.middleware import cors 
from fastapi.requests import Request
from fastapi.responses import StreamingResponse, Response
import requests, httpx, re
from fastapi import HTTPException
from typing import Optional
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/search/{query}")
def search_anime(query: str):
    anilistQuery = '''
        query ($search: String!) {
            Page {
                media(search: $search, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        extraLarge
                    }
                    bannerImage
                    episodes
                    status
                    description
                    seasonYear
                    nextAiringEpisode {
                        airingAt
                        timeUntilAiring
                        episode
                    }
                }
            }
        }
    '''

    variables = {
        'search': query
    }

    url = 'https://graphql.anilist.co'

    response = requests.post(url, json={'query': anilistQuery, 'variables': variables})

    return response.json()["data"]["Page"]["media"]

@app.get("/anime/{id}")
def get_anime(id: int):
    anilistQuery = '''
        query ($id: Int) {
            Media (id: $id) {
                title {
                    romaji
                    english
                }
                coverImage {
                    extraLarge
                }
                bannerImage
                episodes
                status
                description
                seasonYear
                popularity
                averageScore
                genres
                nextAiringEpisode {
                    airingAt
                    timeUntilAiring
                    episode
                }
            }
        }
    '''

    variables = {
        'id': id
    }

    url = 'https://graphql.anilist.co'

    response = requests.post(url, json={'query': anilistQuery, 'variables': variables})

    if response.status_code != 200:
        return {"error": "Anime not found"}

    return response.json()["data"]["Media"]

@app.get("/trending")
def get_trending_anime(page: int = 1, per_page: int = 20):
    anilistQuery = '''
        query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                }
                media(sort: TRENDING_DESC, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        extraLarge
                    }
                    bannerImage
                    episodes
                    status
                    description
                    seasonYear
                    averageScore
                    genres
                }
            }
        }
    '''

    variables = {
        'page': page,
        'perPage': per_page
    }

    url = 'https://graphql.anilist.co'

    response = requests.post(url, json={'query': anilistQuery, 'variables': variables})

    if response.status_code != 200:
        return {"error": "Could not fetch trending anime"}

    data = response.json()["data"]["Page"]
    return {
        "media": data["media"],
        "pageInfo": data["pageInfo"]
    }

@app.get("/popular")
def get_popular_anime(page: int = 1, per_page: int = 20):
    anilistQuery = '''
        query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                }
                media(sort: POPULARITY_DESC, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        extraLarge
                    }
                    bannerImage
                    episodes
                    status
                    description
                    seasonYear
                    averageScore
                    genres
                }
            }
        }
    '''

    variables = {
        'page': page,
        'perPage': per_page
    }

    url = 'https://graphql.anilist.co'

    response = requests.post(url, json={'query': anilistQuery, 'variables': variables})

    if response.status_code != 200:
        return {"error": "Could not fetch popular anime"}

    data = response.json()["data"]["Page"]
    return {
        "media": data["media"],
        "pageInfo": data["pageInfo"]
    }

@app.get("/latest")
def get_latest_anime(page: int = 1, per_page: int = 20):
    anilistQuery = '''
        query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                }
                media(sort: UPDATED_AT_DESC, type: ANIME, status: RELEASING, isAdult: false) {
                    id
                    title {
                        romaji
                        english
                    }
                    coverImage {
                        extraLarge
                    }
                    bannerImage
                    episodes
                    status
                    description
                    seasonYear
                    averageScore
                    genres
                }
            }
        }
    '''

    variables = {
        'page': page,
        'perPage': per_page
    }

    url = 'https://graphql.anilist.co'

    response = requests.post(url, json={'query': anilistQuery, 'variables': variables})

    if response.status_code != 200:
        return {"error": "Could not fetch latest anime"}

    data = response.json()["data"]["Page"]
    return {
        "media": data["media"],
        "pageInfo": data["pageInfo"]
    }

@app.get("/sources")
def get_anime_sources(anilist_id: int, title: str, episode: int, dub: bool = False):
    try: 
        response = requests.post("http://localhost:8000/api/ani-cli/v2/stream", json={
            "anilist_id": anilist_id,
            "title": title,
            "episode": episode,
            "dub": dub
        })
        if response.status_code != 200:
            return {"error": "Sources not found"}
        
        json_response = response.json()
    except Exception as e:
        return {"error": str(e)}

    return json_response

# Create a persistent client with optimized settings
client = httpx.AsyncClient(
    follow_redirects=True, 
    timeout=httpx.Timeout(connect=10.0, read=30.0, write=30.0, pool=10.0),
    limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
)

def parse_range_header(range_header: str, content_length: int) -> tuple[int, int]:
    """Parse HTTP Range header and return start, end positions"""
    if not range_header.startswith("bytes="):
        raise ValueError("Invalid range header")
    
    range_match = re.match(r'bytes=(\d+)?-(\d+)?', range_header)
    if not range_match:
        raise ValueError("Invalid range format")
    
    start_str, end_str = range_match.groups()
    
    # Handle different range formats
    if start_str and end_str:
        # bytes=200-1023
        start, end = int(start_str), int(end_str)
    elif start_str:
        # bytes=200- (from position to end)
        start = int(start_str)
        end = content_length - 1
    elif end_str:
        # bytes=-500 (last 500 bytes)
        start = content_length - int(end_str)
        end = content_length - 1
    else:
        # bytes=- (invalid)
        raise ValueError("Invalid range specification")
    
    # Validate range
    if start < 0:
        start = 0
    if end >= content_length:
        end = content_length - 1
    if start > end:
        raise ValueError("Invalid range: start > end")
    
    return start, end

async def get_content_info(url: str, headers: dict) -> tuple[int, str]:
    """Get content length and type with a HEAD request"""
    try:
        head_response = await client.head(url, headers=headers)
        content_length = int(head_response.headers.get("content-length", 0))
        content_type = head_response.headers.get("content-type", "video/mp4")
        return content_length, content_type
    except:
        # Fallback to GET with small range if HEAD fails
        range_headers = {**headers, "Range": "bytes=0-1023"}
        response = await client.get(url, headers=range_headers)
        content_range = response.headers.get("content-range", "")
        if content_range:
            # Extract total length from "bytes 0-1023/123456789" format
            total_match = re.search(r'/(\d+)', content_range)
            if total_match:
                content_length = int(total_match.group(1))
            else:
                content_length = 0
        else:
            content_length = 0
        content_type = response.headers.get("content-type", "video/mp4")
        return content_length, content_type

async def stream_chunk(url: str, headers: dict, start: int, end: int, chunk_size: int = 8192):
    """Stream content in chunks for the specified range"""
    range_header = f"bytes={start}-{end}"
    request_headers = {**headers, "Range": range_header}
    
    async with client.stream("GET", url, headers=request_headers) as response:
        if response.status_code not in [206, 200]:  # 206 Partial Content or 200 OK
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch content")
        
        async for chunk in response.aiter_bytes(chunk_size):
            yield chunk

@app.get("/proxy")
async def proxy_video(request: Request, url: str, ref: str = "https://example.com"):
    """
    Optimized video proxy with proper range request handling for fast streaming
    """
    # Base headers for the upstream request
    base_headers = {
        "Referer": ref,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.199 Safari/537.36",
        "Accept": "video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5",
        "Accept-Encoding": "identity",  # Disable compression for video
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
    }

    try:
        # Get content info (length and type)
        content_length, content_type = await get_content_info(url, base_headers)
        
        # Check if client is requesting a specific range
        range_header = request.headers.get("range")
        
        if range_header and content_length > 0:
            # Handle partial content request (seeking/buffering)
            try:
                start, end = parse_range_header(range_header, content_length)
                
                # Limit chunk size for faster initial loading
                # For seeking: load only what's requested + small buffer
                max_chunk_size = 1024 * 1024 * 2  # 2MB max per request
                if (end - start + 1) > max_chunk_size:
                    end = start + max_chunk_size - 1
                
                response_headers = {
                    "Content-Range": f"bytes {start}-{end}/{content_length}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(end - start + 1),
                    "Content-Type": content_type,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Range",
                    "Cache-Control": "public, max-age=3600",
                }
                
                return StreamingResponse(
                    stream_chunk(url, base_headers, start, end),
                    status_code=206,  # Partial Content
                    headers=response_headers,
                    media_type=content_type
                )
                
            except ValueError as e:
                # Invalid range, return bad request
                return Response(f"Invalid range: {str(e)}", status_code=416)
        
        else:
            # No range requested - serve initial chunk for fast playback start
            if content_length > 0:
                # Serve only first 2MB for initial load
                initial_chunk_size = min(content_length, 1024 * 1024 * 2)  # 2MB
                start, end = 0, initial_chunk_size - 1
                
                response_headers = {
                    "Content-Range": f"bytes {start}-{end}/{content_length}",
                    "Accept-Ranges": "bytes", 
                    "Content-Length": str(end - start + 1),
                    "Content-Type": content_type,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Range",
                    "Cache-Control": "public, max-age=3600",
                }
                
                return StreamingResponse(
                    stream_chunk(url, base_headers, start, end),
                    status_code=206,  # Partial Content
                    headers=response_headers,
                    media_type=content_type
                )
            
            else:
                # Fallback: stream entire content (for cases where length is unknown)
                async def stream_full():
                    async with client.stream("GET", url, headers=base_headers) as response:
                        async for chunk in response.aiter_bytes(8192):
                            yield chunk
                
                return StreamingResponse(
                    stream_full(),
                    status_code=200,
                    media_type=content_type,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "public, max-age=3600",
                    }
                )

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Proxy request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# AniList Authentication Models
class UpdateProgressRequest(BaseModel):
    media_id: int
    episode: int
    total_episodes: int
    access_token: str

class AniListUserRequest(BaseModel):
    access_token: str

# AniList Authentication Endpoints
@app.post("/anilist/user")
async def get_anilist_user(request: AniListUserRequest):
    """Get AniList user information from access token"""
    query = """
        query {
            Viewer {
                id
                name
                avatar {
                    medium
                }
            }
        }
    """
    
    try:
        response = await client.post(
            "https://graphql.anilist.co",
            headers={
                "Authorization": f"Bearer {request.access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={"query": query}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid access token")
            
        data = response.json()
        
        if "errors" in data:
            raise HTTPException(status_code=401, detail="Authentication failed")
            
        return data["data"]["Viewer"]
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"AniList request failed: {str(e)}")

@app.post("/continue-watching")
async def get_continue_watching(request: AniListUserRequest):
    """Get user's continue watching list from AniList"""
    
    # First get user info
    user_query = """
        query {
            Viewer {
                id
            }
        }
    """
    
    try:
        user_response = await client.post(
            "https://graphql.anilist.co",
            headers={
                "Authorization": f"Bearer {request.access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={"query": user_query}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid access token")
            
        user_data = user_response.json()
        user_id = user_data["data"]["Viewer"]["id"]
        
        # Get continue watching list
        continue_query = """
            query ($userId: Int) {
                MediaListCollection(userId: $userId, type: ANIME, status: CURRENT) {
                    lists {
                        entries {
                            id
                            progress
                            status
                            updatedAt
                            media {
                                id
                                title {
                                    romaji
                                    english
                                }
                                coverImage {
                                    extraLarge
                                }
                                episodes
                                status
                                seasonYear
                            }
                        }
                    }
                }
            }
        """
        
        response = await client.post(
            "https://graphql.anilist.co",
            headers={
                "Authorization": f"Bearer {request.access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "query": continue_query,
                "variables": {"userId": user_id}
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch continue watching")
            
        data = response.json()
        
        if "errors" in data:
            return {"entries": []}
            
        # Extract entries from the nested structure
        entries = []
        if data["data"]["MediaListCollection"]["lists"]:
            for list_item in data["data"]["MediaListCollection"]["lists"]:
                entries.extend(list_item["entries"])
        
        # Sort by most recently updated
        entries.sort(key=lambda x: x.get("updatedAt", 0), reverse=True)
        
        return {"entries": entries}
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"AniList request failed: {str(e)}")

@app.post("/anilist/update-progress")
async def update_progress(request: UpdateProgressRequest):
    """Update anime watching progress on AniList"""
    
    # Determine status based on progress
    status = "COMPLETED" if request.episode >= request.total_episodes else "CURRENT"
    
    mutation = """
        mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
            SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
                id
                progress
                status
                media {
                    title {
                        romaji
                        english
                    }
                }
            }
        }
    """
    
    try:
        response = await client.post(
            "https://graphql.anilist.co",
            headers={
                "Authorization": f"Bearer {request.access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "query": mutation,
                "variables": {
                    "mediaId": request.media_id,
                    "progress": request.episode,
                    "status": status
                }
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to update progress")
            
        data = response.json()
        
        if "errors" in data:
            error_msg = data["errors"][0]["message"] if data["errors"] else "Unknown error"
            raise HTTPException(status_code=400, detail=f"AniList error: {error_msg}")
            
        result = data["data"]["SaveMediaListEntry"]
        
        return {
            "success": True,
            "message": f"Updated progress: Episode {request.episode}/{request.total_episodes} - Status: {status}",
            "data": result
        }
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"AniList request failed: {str(e)}")

@app.get("/anilist/oauth-url")
def get_oauth_url():
    """Get AniList OAuth URL for authentication"""
    client_id = "31463"  # Replace with your actual AniList client ID
    redirect_uri = "https://yoruanime.duckdns.org/auth/callback"
    
    # Use authorization code flow instead of implicit flow
    oauth_url = f"https://anilist.co/api/v2/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code"
    
    return {"oauth_url": oauth_url}

@app.post("/anilist/exchange-code")
async def exchange_code_for_token(code: str):
    """Exchange authorization code for access token"""
    client_id = "31463"  # Your AniList client ID
    client_secret = "EQfNvW9v2hvBoqciEDxP6MotsxEkGuSmIfsP5ku1"  # Replace with your actual client secret
    redirect_uri = "https://yoruanime.duckdns.org/auth/callback"
    
    try:
        response = await client.post(
            "https://anilist.co/api/v2/oauth/token",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
            
        return response.json()
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Token exchange failed: {str(e)}")
