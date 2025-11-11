// Data Loading Functions
async function loadAllData() {
  try {
    document.querySelectorAll('.loading').forEach(el => {
      el.style.display = 'flex';
    });
    
    loadDataFromStorage();
    
    // Check if headlines need refresh
    const shouldRefreshHeadlines = checkHeadlinesFreshness();
    
    // Initialize breaking news FIRST - this is crucial
    if (shouldRefreshHeadlines) {
      await initBreakingNews();
    } else {
      // Use cached headlines if available
      console.log('Using cached headlines');
      const cachedHeadlines = localStorage.getItem('dosfronteras_headlines');
      if (cachedHeadlines) {
        try {
          HEADLINES = JSON.parse(cachedHeadlines);
          renderBreakingNews(HEADLINES);
        } catch (e) {
          console.error('Error parsing cached headlines:', e);
          await initBreakingNews();
        }
      } else {
        await initBreakingNews();
      }
    }
    
    // Start auto-refresh for headlines
    startHeadlinesAutoRefresh();
    
    // Load real news if we don't have any or data is stale
    if (NEWS.length === 0) {
      try {
        const realNews = await fetchRealNews();
        if (realNews.length > 0) {
          NEWS = realNews;
          saveDataToStorage();
        } else {
          // Fallback to sample data
          NEWS = [
            {
              id: 'news-1',
              title: 'Breaking: Major UFC Fight Announced',
              summary: 'A championship bout has been confirmed for the upcoming pay-per-view event.',
              date: '2025-10-28',
              tags: ['UFC', 'Breaking'],
              thumb: ''
            }
          ];
          saveDataToStorage();
        }
      } catch (error) {
        console.error('Error fetching real news:', error);
        // Use fallback data
        NEWS = [
          {
            id: 'news-1',
            title: 'Breaking: Major UFC Fight Announced',
            summary: 'A championship bout has been confirmed for the upcoming pay-per-view event.',
            date: '2025-10-28',
            tags: ['UFC', 'Breaking'],
            thumb: ''
          }
        ];
        saveDataToStorage();
      }
    }
    
    lastUpdateTime = new Date();
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = lastUpdateTime.toLocaleString();
    }
    
    renderNews(NEWS);
    renderFighterStats();
    renderEvents(EVENTS);
    renderQuickStats();
    renderLatestEpisode();
    renderFeaturedVideo();
    renderProducts();
    updateCart();
    
    document.querySelectorAll('.loading').forEach(el => {
      el.style.display = 'none';
    });
    
  } catch (error) {
    console.error('Error loading data:', error);
    document.querySelectorAll('.loading').forEach(el => {
      el.innerHTML = '<div class="data-error">Error loading data. <button class="refresh-btn" onclick="loadAllData()"><i class="fas fa-sync-alt"></i> Retry</button></div>';
    });
  }
}
